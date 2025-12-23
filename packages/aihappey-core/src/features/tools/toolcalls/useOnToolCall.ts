import { useCallback } from "react";
import { useAppStore } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";
import { useConversations } from "aihappey-conversations";
import { useMemoryToolCall } from "./useMemoryToolCall";
import { useLocalSettingsToolCall } from "./useLocalSettingsToolCall";
import { useLocalAgentsToolCall } from "./useLocalAgentsToolCall";
import { useLocalConversationsToolCall } from "./useLocalConversationsToolCall";
import { useReadResourceToolCall } from "./useReadResourceToolCall";
import { useMcpPassthroughToolCall } from "./useMcpPassthroughToolCall";

export function useOnToolCall({ callTool }: {
  callTool: (toolCallId: string, toolName: string, input: any, locale?: string, signal?: AbortSignal) => Promise<any>
}) {
  const enableApps = useAppStore(a => a.enableApps)
  const conversations = useConversations();
  const mcpServerContent = useAppStore(a => a.mcpServerContent)
  const mcpServers = useAppStore(a => a.mcpServers)
  const { handleLocalAgentsToolCall } = useLocalAgentsToolCall();
  const { handleMemoryToolCall } = useMemoryToolCall();
  const { handleLocalSettingsToolCall } = useLocalSettingsToolCall();
  const { handleLocalConversationsToolCall } = useLocalConversationsToolCall(conversations);
  const { i18n } = useTranslation(); // Uncomment when i18n is ready
  const { handleReadResourceToolCall } = useReadResourceToolCall({ mcpServers });
  const { handleMcpPassthroughToolCall } = useMcpPassthroughToolCall({
    callTool,
    enableApps,
    mcpServerContent,
    locale: i18n.language,
  });
  // callback die altijd dezelfde is (dependencies alleen bij init)
  const onToolCall = useCallback(
    async ({ toolCall, signal }: any) => {
      try {

        switch (toolCall.toolName) {
          case "local_conversations_list_all":
          case "local_conversations_get_conversation":
          case "local_conversations_search_text":
            return await handleLocalConversationsToolCall(toolCall);
          case "local_agents_list":
          case "local_agents_create":
          case "local_agents_delete":
            return await handleLocalAgentsToolCall(toolCall);

          case "local_settings_get":
          case "local_settings_set":
            return await handleLocalSettingsToolCall(toolCall);

          case "memory":
            return await handleMemoryToolCall(toolCall);

          case "read_resource":
            return await handleReadResourceToolCall(toolCall);

          default:
            return await handleMcpPassthroughToolCall(toolCall, signal);
        }


      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : String(error);

        return {
          isError: true,
          content: [
            {
              type: "text",
              text: message,
            },
          ],
        };
      }
    },
    [callTool, enableApps]
  );

  return { onToolCall };
}
