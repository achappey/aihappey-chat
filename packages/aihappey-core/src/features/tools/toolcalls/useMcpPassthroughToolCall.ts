import { useCallback } from "react";
import type { CallToolResult } from "aihappey-mcp";
import { OPENAI_OUTPUT_TEMPLATE } from "aihappey-types";
import { readResource as defaultReadResource } from "../../../runtime/mcp/readResource";

type AnyToolCall = {
  toolCallId: string;
  toolName: string;
  input: any;
};

export function useMcpPassthroughToolCall(opts: {
  callTool: (toolCallId: string, toolName: string, input: any, locale?: string, signal?: AbortSignal) => Promise<any>;
  enableApps: boolean;
  mcpServerContent: any;
  locale: string;
  readResource?: typeof defaultReadResource;
}) {
  const readResource = opts.readResource ?? defaultReadResource;

  const handleMcpPassthroughToolCall = useCallback(
    async (toolCall: AnyToolCall, signal?: AbortSignal): Promise<CallToolResult> => {
      const toolResult: CallToolResult = await opts.callTool(
        toolCall.toolCallId,
        toolCall.toolName,
        toolCall.input,
        opts.locale,
        signal
      );

      if (!opts.enableApps) return toolResult;
      if (!toolResult?._meta?.[OPENAI_OUTPUT_TEMPLATE]) return toolResult;

      const key = Object.entries(opts.mcpServerContent)
        .find(([_, v]: any) => v?.tools?.some((t: any) => t?.name === toolCall.toolName))
        ?.[0] as string | undefined;

      if (!key) return toolResult;

      const widget = await readResource(key, toolResult._meta[OPENAI_OUTPUT_TEMPLATE] as string);
      if (!widget) return toolResult;

      const first = widget.contents?.[0];
      if (!first) return toolResult;

      if (first.mimeType !== "text/html+skybridge") return toolResult;

      const html = (first as any).text ?? null;
      const widgetName = first.uri ?? null;
      const desc = first?._meta?.["openai/widgetDescription"];

      const modelText =
        `INJECTED BY CHAT APP: The chat app rendered a widget.\n\n` +
        `Uri: ${widgetName}\nDescription: ${desc}`;

      return {
        ...toolResult,
        content: [...(toolResult.content ?? []), { type: "text", text: modelText }],
        _meta: {
          ...toolResult._meta,
          ["chat/html"]: html,
          ...(desc ? { ["chat/widgetDescription"]: desc } : {}),
        },
      };
    },
    [opts, readResource]
  );

  return { handleMcpPassthroughToolCall };
}
