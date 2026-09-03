import { useCallback } from "react";
import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types";
import type { ConversationsContextType, StorageKind } from "aihappey-conversations";
import { useAppStore } from "aihappey-state";
import {
  createConversationExportArchive,
  downloadExport,
} from "../../user-settings/export/exportEngine";

const ok = (structuredContent: any): CallToolResult => ({
  isError: false,
  structuredContent,
  content: [],
});

const fail = (error: unknown): CallToolResult => ({
  isError: true,
  content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }],
});

export const chatManagementReadTool: Tool = {
  name: "chat_management_read_markdown",
  title: "Read conversation as Markdown",
  description: "Read a conversation from local or remote storage as Markdown, without attachment bytes.",
  inputSchema: {
    type: "object",
    properties: {
      storage: { type: "string", enum: ["local", "remote"] },
      conversationId: { type: "string" },
    },
    required: ["storage", "conversationId"],
  },
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
};

export const chatManagementTransferTool: Tool = {
  name: "chat_management_transfer",
  title: "Copy or move conversations",
  description: "Copy or move selected or all conversations between local and remote storage. Remote storage is enabled automatically when needed.",
  inputSchema: {
    type: "object",
    properties: {
      source: { type: "string", enum: ["local", "remote"] },
      destination: { type: "string", enum: ["local", "remote"] },
      mode: { type: "string", enum: ["copy", "move"] },
      conversationIds: { type: "array", items: { type: "string" }, minItems: 1 },
      all: { type: "boolean" },
    },
    required: ["source", "destination", "mode"],
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
};

export const chatManagementExportTool: Tool = {
  name: "chat_management_export",
  title: "Export conversations",
  description: "Download one or all conversations from local or remote storage as the same JSON-in-ZIP format used by Settings export.",
  inputSchema: {
    type: "object",
    properties: {
      storage: { type: "string", enum: ["local", "remote"] },
      conversationId: { type: "string" },
      all: { type: "boolean" },
    },
    required: ["storage"],
  },
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
};

export const chatManagementPluginDef = {
  name: "chat-management",
  match: (toolName: string) => toolName.startsWith("chat_management_"),
  tools: [chatManagementReadTool, chatManagementTransferTool, chatManagementExportTool],
};

const attachmentName = (part: any) => part?.filename ?? part?.providerMetadata?.openai?.filename ?? "attachment";
const scalar = (value: unknown) => String(value ?? "").replace(/\r?\n/g, " ");

export function conversationToMarkdown(conversation: any): string {
  const metadata = conversation?.metadata ?? {};
  const lines = [
    `# ${scalar(metadata.name ?? "Conversation")}`,
    "",
    "## Metadata",
    "",
    `- ID: \`${scalar(conversation.id)}\``,
  ];
  for (const [key, value] of Object.entries(metadata)) {
    if (key === "name" || value === undefined) continue;
    lines.push(`- ${scalar(key)}: ${typeof value === "string" ? scalar(value) : `\`${JSON.stringify(value)}\``}`);
  }
  lines.push("", "## Messages");
  for (const message of conversation.messages ?? []) {
    const role = String(message?.role ?? "").toLowerCase();
    if (!["system", "user", "assistant"].includes(role)) continue;
    lines.push("", `### ${role.charAt(0).toUpperCase()}${role.slice(1)}`, "");
    for (const part of message.parts ?? []) {
      if (part?.type === "text" && typeof part.text === "string") lines.push(part.text, "");
      if (part?.type === "file") {
        const mediaType = part?.mediaType ?? part?.mimeType ?? "application/octet-stream";
        lines.push(`- Attachment: **${scalar(attachmentName(part))}** (${scalar(mediaType)})`, "");
      }
    }
  }
  return lines.join("\n").trimEnd() + "\n";
}

function markdownResult(conversation: any): CallToolResult {
  return {
    isError: false,
    structuredContent: {
      conversationId: conversation.id,
      name: conversation?.metadata?.name ?? "Conversation",
      mimeType: "text/markdown",
    },
    content: [{
      type: "resource",
      resource: {
        uri: `conversation:///${encodeURIComponent(conversation.id)}.md`,
        mimeType: "text/markdown",
        text: conversationToMarkdown(conversation),
      },
    }],
  };
}

const storageKind = (value: unknown, field: string): StorageKind => {
  if (value !== "local" && value !== "remote") throw new Error(`Invalid ${field} storage.`);
  return value;
};

export function useChatManagementRuntime(conversations?: ConversationsContextType | null) {
  const remoteStorageConnected = useAppStore((state) => state.remoteStorageConnected);
  const setRemoteStorageConnected = useAppStore((state) => state.setRemoteStorageConnected);
  const handle = useCallback(async (toolCall: { toolName: string; input: any }): Promise<CallToolResult> => {
    try {
      if (!conversations) throw new Error("Conversations context not available.");
      const enableRemote = (...kinds: StorageKind[]) => {
        if (kinds.includes("remote") && !remoteStorageConnected) setRemoteStorageConnected(true);
      };
      if (toolCall.toolName === "chat_management_read_markdown") {
        const storage = storageKind(toolCall.input?.storage, "storage");
        const id = toolCall.input?.conversationId;
        if (!id) throw new Error("Missing conversationId.");
        enableRemote(storage);
        const conversation = await conversations.getStore(storage).get(id);
        if (!conversation) throw new Error(`Conversation '${id}' was not found.`);
        return markdownResult(conversation);
      }
      if (toolCall.toolName === "chat_management_transfer") {
        const source = storageKind(toolCall.input?.source, "source");
        const destination = storageKind(toolCall.input?.destination, "destination");
        const mode = toolCall.input?.mode;
        if (source === destination) throw new Error("Source and destination storage must differ.");
        if (mode !== "copy" && mode !== "move") throw new Error("Invalid transfer mode.");
        const ids = Array.isArray(toolCall.input?.conversationIds)
          ? Array.from(new Set<string>(toolCall.input.conversationIds.filter((id: unknown): id is string => typeof id === "string" && !!id.trim())))
          : [];
        if (toolCall.input?.all === true && ids.length) throw new Error("Use either all or conversationIds, not both.");
        if (toolCall.input?.all !== true && !ids.length) throw new Error("Provide conversationIds or set all to true.");
        enableRemote(source, destination);
        const sourceStore = conversations.getStore(source);
        const destinationStore = conversations.getStore(destination);
        const selectedIds = toolCall.input?.all === true ? (await sourceStore.list()).map((item) => item.id) : ids;
        const results: any[] = [];
        for (const sourceId of selectedIds) {
          try {
            const conversation = await sourceStore.get(sourceId);
            if (!conversation) throw new Error("Conversation was not found in source storage.");
            const destinationId = await destinationStore.import(conversation);
            if (mode === "move") await sourceStore.remove(sourceId);
            results.push({ sourceId, destinationId, status: mode === "move" ? "moved" : "copied" });
          } catch (error) {
            results.push({ sourceId, status: "failed", error: error instanceof Error ? error.message : String(error) });
          }
        }
        await conversations.refresh();
        const failed = results.filter((item) => item.status === "failed").length;
        return ok({ source, destination, mode, total: results.length, succeeded: results.length - failed, failed, results });
      }
      if (toolCall.toolName === "chat_management_export") {
        const storage = storageKind(toolCall.input?.storage, "storage");
        const id = toolCall.input?.conversationId;
        if (toolCall.input?.all === true && id) throw new Error("Use either all or conversationId, not both.");
        if (toolCall.input?.all !== true && !id) throw new Error("Provide conversationId or set all to true.");
        enableRemote(storage);
        const store = conversations.getStore(storage);
        const items = toolCall.input?.all === true ? await store.loadAll() : [await store.get(id)].filter(Boolean);
        if (!items.length) throw new Error(`Conversation '${id}' was not found.`);
        downloadExport(await createConversationExportArchive(items), "conversations");
        return ok({ status: "download-started", storage, count: items.length, conversationIds: items.map((item) => item!.id) });
      }
      throw new Error(`Unsupported tool: ${toolCall.toolName}`);
    } catch (error) {
      return fail(error);
    }
  }, [conversations, remoteStorageConnected, setRemoteStorageConnected]);

  return { name: chatManagementPluginDef.name, handle };
}
