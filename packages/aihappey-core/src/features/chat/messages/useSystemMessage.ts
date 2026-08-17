import { useMemo } from "react";
import { useAppStore } from "aihappey-state";
import { useAccount } from "aihappey-auth";
import { useTranslation } from "aihappey-i18n";
import { useDarkMode } from "usehooks-ts";
import { buildSystemMessage } from "./buildSystemMessage";
import { useUserLocation } from "../../../shell/connectors/useUserLocation";
import { useChatContext } from "../context/ChatContext";
import { CLIENT_RESOURCE_SEARCH_PLUGIN_ID } from "../../tools/clientResourceSearch";
import { useRuntimeSkills } from "../../skills/useRuntimeSkills";

export function useSystemMessage() {
  const mcpServerContent = useAppStore((s) => s.mcpServerContent);
  const systemInstructions = useAppStore((s) => s.systemInstructions);
  const accountLocation = useAppStore((s) => s.accountLocation);
  const enableUserLocation = useAppStore((s) => s.enableUserLocation);
  const mcpServers = useAppStore((s) => s.mcpServers);
  const activePlugins = useAppStore((s) => s.activePlugins);
  const account = useAccount();
  useUserLocation(enableUserLocation);
  const { isDarkMode } = useDarkMode();
  const { i18n } = useTranslation();
  const { config } = useChatContext();
  const runtimeSkills = useRuntimeSkills();
  const chatbotInstructions = config.chatbotInstructions;
  const servers = Object.keys(mcpServers).map(z => ({
    name: z,
    clientConfig: mcpServers[z],
  }))

  const connected = servers.filter(a => a?.clientConfig?.config.disabled != true);
  const records: Record<string, any> = Object.fromEntries(
    connected.map(z => [z.name, z.clientConfig])
  );

  const enabledSkills = useMemo(() => {
    return runtimeSkills.enabled
      .map((item) => ({ skillId: item.skillId, name: item.name, description: item.description }));
  }, [runtimeSkills.enabled]);

  const systemMsg = useMemo(() => {
    const userContext = account
      ? {
        username: account.username,
        name: account.name,
        id: account.localAccountId,
        tenantId: account.tenantId,
        preferredLanguage: i18n.language,
        darkMode: isDarkMode,
      }
      : {
        preferredLanguage: i18n.language,
        darkMode: isDarkMode,
      };

    return buildSystemMessage(
      mcpServerContent,
      records,
        systemInstructions,
        chatbotInstructions,
        accountLocation,
        config.appName,
        userContext,
        enabledSkills,
        runtimeSkills.plugins
          .filter((plugin) => plugin.files.length > 0)
          .map((plugin) => ({
            name: plugin.name,
            description: plugin.description,
            version: plugin.version,
            files: plugin.files.map((file) => file.path),
          })),
        activePlugins.includes(CLIENT_RESOURCE_SEARCH_PLUGIN_ID),
      );
  }, [
    mcpServerContent,
    connected,
    systemInstructions,
    chatbotInstructions,
    account?.username,
    account?.name,
    account?.localAccountId,
    i18n.language,
    isDarkMode,
    account?.tenantId,
    enabledSkills,
    runtimeSkills.plugins,
    activePlugins,
  ]);
  return systemMsg;
}
