import type { Tool } from "@modelcontextprotocol/sdk/types";
import type { UIMessage } from "aihappey-types";

export type RealtimeContentPart =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string };

export const stripProviderPrefix = (modelId: string) => {
  const parts = String(modelId ?? "").split("/");
  return parts.length > 1 ? parts.slice(1).join("/") : String(modelId ?? "");
};

export const uiMessageToRealtimeContent = (message: UIMessage): RealtimeContentPart[] => {
  const content: RealtimeContentPart[] = [];

  for (const part of message.parts ?? []) {
    if (!part) continue;

    if (part.type === "text" && typeof part.text === "string" && part.text.trim()) {
      content.push({ type: "input_text", text: part.text });
      continue;
    }

    if (part.type === "file") {
      const filename = String(part.filename ?? part.name ?? "attachment");
      const mediaType = String(part.mediaType ?? part.mimeType ?? "application/octet-stream");
      const url = String(part.url ?? "");

      if (mediaType.startsWith("image/") && url) {
        content.push({ type: "input_image", image_url: url });
      } else if (url) {
        content.push({
          type: "input_text",
          text: `Attached file: ${filename} (${mediaType}).\n${url}`,
        });
      } else {
        content.push({
          type: "input_text",
          text: `Attached file: ${filename} (${mediaType}).`,
        });
      }
      continue;
    }
  }

  return content;
};

export const realtimeContentToText = (content: RealtimeContentPart[]) => {
  return content
    .map((part) => (part.type === "input_text" ? part.text : "[image attachment]"))
    .filter(Boolean)
    .join("\n\n")
    .trim();
};

export const mcpToolToRealtimeFunctionTool = (tool: Tool) => ({
  type: "function" as const,
  name: tool.name,
  description: tool.description ?? tool.annotations?.title ?? tool.name,
  parameters: (tool as any).inputSchema ?? {
    type: "object",
    properties: {},
  },
});

export const newUiMessage = (role: "user" | "assistant", parts: any[], metadata?: Record<string, any>): UIMessage => ({
  id: crypto.randomUUID(),
  role,
  parts,
  metadata: {
    timestamp: new Date().toISOString(),
    ...(metadata ?? {}),
  },
});

export const extractTextFromRealtimeResponse = (response: any) => {
  const chunks: string[] = [];
  const output = Array.isArray(response?.output) ? response.output : [];

  for (const item of output) {
    if (item?.type !== "message") continue;
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const part of content) {
      const text = part?.text ?? part?.transcript;
      if (typeof text === "string" && text.trim()) chunks.push(text.trim());
    }
  }

  return chunks.join("\n\n").trim();
};

export const extractFunctionCallsFromRealtimeResponse = (response: any) => {
  const output = Array.isArray(response?.output) ? response.output : [];
  return output.filter((item: any) => item?.type === "function_call" && item?.call_id && item?.name);
};

