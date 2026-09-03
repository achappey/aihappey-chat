import { useCallback } from "react";
import type { ConversationsContextType } from "aihappey-conversations";
import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types";
import { UIMessage } from "aihappey-ai";
import { extractTextFromFile } from "../../chat/files/file";

const ok = (item: any): CallToolResult => ({
  isError: false,
  structuredContent: item,
  content: []
});

const fail = (err: unknown): CallToolResult => ({
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

export const localConversationsReadAttachmentTool: Tool = {
  name: "local_conversations_read_attachment",
  title: "Read a local conversation attachment",
  description:
    "Extract text from an inline attachment in a local conversation. Use the conversation id, message id, and filename shown by the conversation tool. HTTP attachments are not supported.",
  inputSchema: {
    type: "object",
    properties: {
      conversationId: { type: "string", description: "Id of the conversation" },
      messageId: { type: "string", description: "Id of the message containing the attachment" },
      filename: { type: "string", description: "Exact attachment filename" },
    },
    required: ["conversationId", "messageId", "filename"],
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
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
    localConversationsReadAttachmentTool,
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

type ConversationLike = {
  id: string;
  messages?: UIMessage[];
  [key: string]: any;
};

function attachmentFilename(part: any): string | undefined {
  const filename = part?.filename
    ?? part?.providerMetadata?.openai?.filename;
  return typeof filename === "string" && filename ? filename : undefined;
}

/**
 * Clone the conversation shape exposed to the model and omit attachment bytes.
 * The stored conversation is intentionally left untouched so attachments remain readable.
 */
export function sanitizeConversationForTool<T extends ConversationLike | null>(conversation: T): T {
  if (!conversation) return conversation;

  return {
    ...conversation,
    messages: (conversation.messages ?? []).map((message) => ({
      ...message,
      parts: (message.parts ?? []).map((part: any) => {
        if (part?.type !== "file") return part;
        const { url: _rawAttachmentData, ...safePart } = part;
        return safePart;
      }),
    })),
  } as T;
}

function inlineAttachmentToFile(part: any, filename: string): File {
  const url = part?.url;
  if (typeof url !== "string" || !url.trim()) {
    throw new Error(`Attachment '${filename}' has no inline data.`);
  }
  if (/^https?:\/\//i.test(url)) {
    throw new Error(`Attachment '${filename}' uses an HTTP URL; only inline attachments can be read.`);
  }

  let base64 = url;
  let mediaType = part?.mediaType || part?.mimeType || "application/octet-stream";
  if (url.startsWith("data:")) {
    const match = /^data:([^;,]+);base64,([\s\S]+)$/i.exec(url);
    if (!match) throw new Error(`Attachment '${filename}' has an invalid or non-base64 data URI.`);
    mediaType = part?.mediaType || part?.mimeType || match[1] || mediaType;
    base64 = match[2];
  }

  try {
    const binary = atob(base64.replace(/\s/g, ""));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new File([bytes], filename, { type: mediaType });
  } catch {
    throw new Error(`Attachment '${filename}' contains invalid base64 data.`);
  }
}

export async function readConversationAttachment(
  conversation: ConversationLike,
  messageId: string,
  filename: string
) {
  const message = (conversation.messages ?? []).find((item) => item?.id === messageId);
  if (!message) throw new Error(`Message '${messageId}' was not found in conversation '${conversation.id}'.`);

  const matches = (message.parts ?? []).filter((part: any) =>
    part?.type === "file" && attachmentFilename(part) === filename
  );
  if (matches.length === 0) {
    throw new Error(`Attachment '${filename}' was not found in message '${messageId}'.`);
  }
  if (matches.length > 1) {
    throw new Error(`Attachment filename '${filename}' is ambiguous in message '${messageId}'.`);
  }

  const part = matches[0];
  const file = inlineAttachmentToFile(part, filename);
  const text = await extractTextFromFile(file);
  if (!text?.trim()) {
    throw new Error(`Attachment '${filename}' is unsupported or contains no extractable text.`);
  }

  return {
    conversationId: conversation.id,
    messageId,
    filename,
    mediaType: file.type,
    text,
  };
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

  return conversations.search(q, cappedLimit);
}

/* ============================================================
   Plugin RUNTIME (execution only)
============================================================ */

type LocalConversationsToolCall = {
  toolName:
  | "local_conversations_list_all"
  | "local_conversations_search_text"
  | "local_conversations_get_conversation"
  | "local_conversations_read_attachment"
  | "local_conversations_delete_conversation";
  input: any;
};

export function useLocalConversationsRuntime(conversations?: ConversationsContextType | null) {
  const handle = useCallback(
    async (toolCall: LocalConversationsToolCall): Promise<CallToolResult> => {
      try {
        if (!conversations) throw new Error("Conversations context not available.");

        switch (toolCall.toolName) {
          case "local_conversations_list_all": {
            const items = (conversations.items ?? []).map(a => ({
              id: a.id,
              metadata: { name: a.name },
              messageCount: a.messageCount,
              activityAt: a.activityAt,
            }));
            return ok({
              conversations: items
            });
          }

          case "local_conversations_get_conversation": {
            const { conversationId } = toolCall.input ?? {};
            if (!conversationId) throw new Error("Missing conversationId.");

            const convo = await conversations.get(conversationId) ?? null;

            return ok(sanitizeConversationForTool(convo));
          }

          case "local_conversations_read_attachment": {
            const { conversationId, messageId, filename } = toolCall.input ?? {};
            if (!conversationId) throw new Error("Missing conversationId.");
            if (!messageId) throw new Error("Missing messageId.");
            if (!filename) throw new Error("Missing filename.");

            const convo = await conversations.get(conversationId);
            if (!convo) throw new Error(`Conversation '${conversationId}' was not found.`);

            return ok(await readConversationAttachment(convo, messageId, filename));
          }

          case "local_conversations_delete_conversation": {
            const { conversationId } = toolCall.input ?? {};
            if (!conversationId) throw new Error("Missing conversationId.");

            await conversations.remove(conversationId);

            return ok(
              { deletedId: conversationId, status: "deleted" }
            );
          }

          case "local_conversations_search_text": {
            const { query } = toolCall.input ?? {};
            const payload = await searchLocalConversationsText(
              conversations,
              query,
              toolCall.input?.limit
            );
            return ok(payload);
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
