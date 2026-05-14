import { useCallback } from "react";
import type { ConversationsContextType } from "aihappey-conversations";
import type { Tool } from "@modelcontextprotocol/sdk/types";
import { UIMessage } from "aihappey-ai";

/* ============================================================
   Result helpers
============================================================ */

type ToolTextResult = {
  isError: boolean;
  content: { type: "text"; text: string }[];
};

const ok = (text: string): ToolTextResult => ({
  isError: false,
  content: [{ type: "text", text }],
});

const fail = (err: unknown): ToolTextResult => ({
  isError: true,
  content: [{ type: "text", text: err instanceof Error ? err.message : String(err) }],
});

/* ============================================================
   Tool definitions (STATIC)
============================================================ */

export const localConversationsListTool: Tool = {
  name: "local_conversations_list_all",
  title: "List local conversations",
  description: "List all local conversations.",
  inputSchema: { type: "object", properties: {} },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
  },
};

export const localConversationsGetTool: Tool = {
  name: "local_conversations_get_conversation",
  title: "Get local conversation by id",
  description: "Get local conversation by id.",
  inputSchema: {
    type: "object",
    properties: {
      conversationId: { type: "string", description: "Id of the conversation" },
    },
    required: ["conversationId"],
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
  },
};

export const localConversationsDeleteTool: Tool = {
  name: "local_conversations_delete_conversation",
  title: "Delete local conversation by id",
  description: "Delete a local conversation by id.",
  inputSchema: {
    type: "object",
    properties: {
      conversationId: { type: "string", description: "Id of the conversation" },
    },
    required: ["conversationId"],
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
  },
};

export const localConversationsSearchTextTool: Tool = {
  name: "local_conversations_search_text",
  title: "Search local conversations (text only)",
  description:
    "Plain text search across local conversations. Searches only text parts. Multi-word queries match when all words occur in the same text part, regardless of order or distance.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          "Search query. Single words use substring match; multi-word queries require every word in the same text part.",
      },
      limit: { type: "number", description: "Max results (default 20, max 50)" },
    },
    required: ["query"],
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};

/* ============================================================
   Plugin DEFINITION (STATIC)
============================================================ */

export const localConversationsPluginDef = {
  name: "local-conversations",
  match: (toolName: string) => toolName.startsWith("local_conversations_"),
  tools: [
    localConversationsGetTool,
    localConversationsListTool,
    localConversationsSearchTextTool,
    localConversationsDeleteTool,
  ],
};

/* ============================================================
   Shared helpers
============================================================ */

function extractTextParts(msg: UIMessage): string[] {
  const parts = msg?.parts ?? [];
  return parts
    .filter(p => p?.type === "text")
    .map(p => p.text as string)
    .filter(Boolean);
}

type SearchTermMatch = {
  term: string;
  index: number;
};

function tokenizeSearchQuery(query: string): string[] {
  const seen = new Set<string>();
  const terms: string[] = [];

  for (const token of query.toLocaleLowerCase().split(/\s+/).filter(Boolean)) {
    if (seen.has(token)) continue;
    seen.add(token);
    terms.push(token);
  }

  return terms;
}

function getSearchTermMatches(haystack: string, terms: string[]): SearchTermMatch[] | null {
  const hay = haystack.toLocaleLowerCase();
  const matches = terms.map((term) => ({ term, index: hay.indexOf(term) }));

  if (matches.some((match) => match.index === -1)) return null;

  return matches.sort((a, b) => a.index - b.index);
}

function createSearchSnippet(text: string, matches: SearchTermMatch[]): string {
  const compactText = text.replace(/\s+/g, " ").trim();

  if (compactText.length <= 320) return compactText;

  const firstMatch = matches[0];
  if (!firstMatch) return compactText.slice(0, 240).trimEnd() + "…";

  const contextChars = 90;
  const maxSnippetLength = 260;
  const lastMatchEnd = Math.max(
    ...matches.map((match) => match.index + match.term.length)
  );

  let start = Math.max(0, firstMatch.index - contextChars);
  let end = Math.min(text.length, lastMatchEnd + contextChars);

  if (end - start > maxSnippetLength) {
    end = Math.min(text.length, start + maxSnippetLength);
  }

  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";
  const excerpt = text.slice(start, end).replace(/\s+/g, " ").trim();

  return `${prefix}${excerpt}${suffix}`;
}

export type LocalConversationTextSearchHit = {
  conversationId: string;
  messageId: string | null;
  messageIndex: number;
  role: string;
  partIndex: number;
  matchIndex: number;
  snippet: string;
};

export type LocalConversationTextSearchResult = {
  query: string;
  total: number;
  limit: number;
  results: LocalConversationTextSearchHit[];
};

/**
 * Shared implementation for local conversation text search.
 * Kept in this file to ensure the UI and the tool have identical behavior.
 */
export async function searchLocalConversationsText(
  conversations: ConversationsContextType,
  query: string,
  limit = 20
): Promise<LocalConversationTextSearchResult> {
  const q = (query ?? "").trim();
  if (!q) throw new Error("Missing query.");

  const terms = tokenizeSearchQuery(q);

  const cappedLimit = Math.max(1, Math.min(50, Number(limit ?? 20)));

  const results: LocalConversationTextSearchHit[] = [];
  const conversationItems = await conversations.list();

  for (const convo of conversationItems) {
    const messages = convo?.messages ?? [];

    for (let messageIndex = 0; messageIndex < messages.length; messageIndex++) {
      const msg = messages[messageIndex];
      const role = msg?.role ?? msg?.metadata?.author ?? "unknown";
      const msgId = msg?.id ?? null;

      const textParts = extractTextParts(msg as any);
      for (let partIndex = 0; partIndex < textParts.length; partIndex++) {
        const text = textParts[partIndex];
        const matches = getSearchTermMatches(text, terms);
        if (!matches) continue;

        results.push({
          conversationId: convo.id,
          messageId: msgId,
          messageIndex,
          role,
          partIndex,
          matchIndex: matches[0]?.index ?? 0,
          snippet: createSearchSnippet(text, matches),
        });

        if (results.length >= cappedLimit) break;
      }

      if (results.length >= cappedLimit) break;
    }

    if (results.length >= cappedLimit) break;
  }

  return {
    query: q,
    total: results.length,
    limit: cappedLimit,
    results,
  };
}

/* ============================================================
   Plugin RUNTIME (execution only)
============================================================ */

type LocalConversationsToolCall = {
  toolName:
    | "local_conversations_list_all"
    | "local_conversations_search_text"
    | "local_conversations_get_conversation"
    | "local_conversations_delete_conversation";
  input: any;
};

export function useLocalConversationsRuntime(conversations?: ConversationsContextType | null) {
  const handle = useCallback(
    async (toolCall: LocalConversationsToolCall): Promise<ToolTextResult> => {
      try {
        if (!conversations) throw new Error("Conversations context not available.");

        switch (toolCall.toolName) {
          case "local_conversations_list_all": {
            const items = (conversations.items ?? []).map(a => ({
              id: a.id,
              metadata: a.metadata,
              messageCount: a.messages?.length ?? 0,
            }));
            return ok(JSON.stringify(items));
          }

          case "local_conversations_get_conversation": {
            const { conversationId } = toolCall.input ?? {};
            if (!conversationId) throw new Error("Missing conversationId.");

            const convo =
              (conversations.items ?? []).find(a => a.id === conversationId) ?? null;

            return ok(JSON.stringify(convo));
          }

          case "local_conversations_delete_conversation": {
            const { conversationId } = toolCall.input ?? {};
            if (!conversationId) throw new Error("Missing conversationId.");

            await conversations.remove(conversationId);

            return ok(
              JSON.stringify({ deletedId: conversationId, status: "deleted" })
            );
          }

          case "local_conversations_search_text": {
            const { query } = toolCall.input ?? {};
            const payload = await searchLocalConversationsText(
              conversations,
              query,
              toolCall.input?.limit
            );
            return ok(JSON.stringify(payload));
          }

          default:
            throw new Error(`Unsupported tool: ${toolCall.toolName}`);
        }
      } catch (e) {
        return fail(e);
      }
    },
    [conversations]
  );

  return {
    name: localConversationsPluginDef.name,
    handle,
  };
}
