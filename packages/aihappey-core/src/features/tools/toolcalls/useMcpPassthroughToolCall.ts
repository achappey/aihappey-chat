import { useCallback } from "react";
import type { CallToolResult } from "aihappey-mcp";
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
      if (!((toolResult?._meta?.ui as any)?.resourceUri)
        || !((toolResult?._meta?.ui as any)?.resourceUri.startsWith("ui://")))
        return toolResult;

      const key = Object.entries(opts.mcpServerContent)
        .find(([_, v]: any) => v?.tools?.some((t: any) => t?.name === toolCall.toolName))
        ?.[0] as string | undefined;

      if (!key) return toolResult;

      const widget = await readResource(key, (toolResult?._meta?.ui as any)?.resourceUri as string);
      if (!widget) return toolResult;

      const first = widget.contents?.[0];
      if (!first) return toolResult;

      if (first.mimeType !== "text/html;profile=mcp-app") return toolResult;

      const html = (first as any).text ?? null;

      return {
        ...toolResult,
        _meta: {
          ...toolResult._meta,
          ["chat/html"]: html
        },
      };
    },
    [opts, readResource]
  );

  return { handleMcpPassthroughToolCall };
}
