import { useCallback } from "react";
import type { ConversationsContextType } from "aihappey-conversations";
import type { Tool } from "@modelcontextprotocol/sdk/types";
import { UIMessage } from "aihappey-ai";

type ToolTextResult = {
  isError: boolean;
  content: { type: "text"; text: string }[];
};

function ok(text: string): ToolTextResult {
  return { isError: false, content: [{ type: "text", text }] };
}

function fail(err: unknown): ToolTextResult {
  const message = err instanceof Error ? err.message : String(err);
  return { isError: true, content: [{ type: "text", text: message }] };
}

type LocalConversationsToolName =
  | "local_conversations_list_all"
  | "local_conversations_search_text"
  | "local_conversations_get_conversation";

type LocalConversationsToolCall = {
  toolName: LocalConversationsToolName;
  input: any;
};

function extractTextParts(msg: UIMessage): string[] {
  const parts = msg?.parts ?? []

  const textsFromParts = parts
    .filter(p => p?.type === "text")
    .map(p => p.text as string);

  // Important: still only return plain strings (treat as "text parts").
  return textsFromParts.length ? textsFromParts : [];
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
 *
 * Kept in this file to ensure the UI and the tool have identical behavior.
 */
export async function searchLocalConversationsText(
  conversations: ConversationsContextType,
  query: string,
  limit = 20
): Promise<LocalConversationTextSearchResult> {
  const q = (query ?? "").trim();
  if (!q) throw new Error("Missing query.");

  const cappedLimit = Math.max(1, Math.min(50, Number(limit ?? 20)));

  const results: LocalConversationTextSearchHit[] = [];
  const conversationItems = await conversations.list();

  for (const convo of conversationItems) {
    const messages = convo?.messages ?? [];

    for (let messageIndex = 0; messageIndex < messages.length; messageIndex++) {
      const msg = messages[messageIndex];
      const role = msg?.role ?? msg?.metadata?.author ?? "unknown";
      const msgId = msg?.id ?? msg?.id ?? null;

      const textParts = extractTextParts(msg as any);
      for (let partIndex = 0; partIndex < textParts.length; partIndex++) {
        const text = textParts[partIndex];
        const hay = text.toLowerCase();
        const idx = hay.indexOf(q.toLowerCase());
        if (idx === -1) continue;

        results.push({
          conversationId: convo.id,
          messageId: msgId,
          messageIndex,
          role,
          partIndex,
          matchIndex: idx,
          snippet: text,
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

export function useLocalConversationsToolCall(conversations?: ConversationsContextType | null) {
  const handleLocalConversationsToolCall = useCallback(
    async (toolCall: LocalConversationsToolCall): Promise<ToolTextResult> => {
      try {
        if (!conversations) {
          throw new Error("Conversations context not available.");
        }

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

            const convo = (conversations.items ?? []).find(a => a.id === conversationId) ?? null;
            return ok(JSON.stringify(convo));
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

  return { handleLocalConversationsToolCall };
}

export const localConversationsListTool: Tool = {
  name: "local_conversations_list_all",
  title: "List local conversations",
  description: "List all local conversations.",
  inputSchema: {
    type: "object",
    properties: {
    },

    required: [
    ]
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false
  }
};

export const localConversationsGetTool: Tool = {
  name: "local_conversations_get_conversation",
  title: "Get local conversation by id",
  description: "Get local conversation by id.",
  inputSchema: {
    type: "object",
    properties: {
      conversationId: {
        type: "string",
        description: "Id of the conversation"
      },
    },

    required: [
      "conversationId"
    ]
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false
  }
};


export const localConversationsSearchTextTool: Tool = {
  name: "local_conversations_search_text",
  title: "Search local conversations (text only)",
  description: "Plain text search across local conversations. Searches only text parts.",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query (substring match)" },
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
