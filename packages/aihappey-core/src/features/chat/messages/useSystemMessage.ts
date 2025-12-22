import { useMemo } from "react";
import { useAppStore } from "aihappey-state";
import { useAccount } from "aihappey-auth";
import { useTranslation } from "aihappey-i18n";
import { useDarkMode } from "usehooks-ts";
import { buildSystemMessage } from "./buildSystemMessage";
import { useUserLocation } from "../../../shell/connectors/useUserLocation";
import { useChatContext } from "../context/ChatContext";

export function useSystemMessage() {
  const mcpServerContent = useAppStore((s) => s.mcpServerContent);
  const systemInstructions = useAppStore((s) => s.systemInstructions);
  const accountLocation = useAppStore((s) => s.accountLocation);
  const enableUserLocation = useAppStore((s) => s.enableUserLocation);
  const mcpServers = useAppStore((s) => s.mcpServers);
  const account = useAccount();
  useUserLocation(enableUserLocation);
  const { isDarkMode } = useDarkMode();
  const { i18n } = useTranslation();
  const { config } = useChatContext();
  const servers = Object.keys(mcpServers).map(z => ({
    name: z,
    clientConfig: mcpServers[z],
  }))

  const connected = servers.filter(a => a?.clientConfig?.config.disabled != true);
  const records: Record<string, any> = Object.fromEntries(
    connected.map(z => [z.name, z.clientConfig])
  );

  const systemMsg = useMemo(() => {
    return buildSystemMessage(
      mcpServerContent,
      //   clients,
      records,
      //  resources,
      //    resourceTemplates,
      systemInstructions,
      accountLocation,
      config.appName,
      account
        ? {
          username: account?.username,
          name: account?.name,
          id: account?.localAccountId,
          tenantId: account?.tenantId,
          preferredLanguage: i18n.language,
          darkMode: isDarkMode
        }
        : undefined
    );
  }, [
    mcpServerContent,
    connected,
    systemInstructions,
    account?.username,
    account?.name,
    account?.localAccountId,
    i18n.language,
    isDarkMode,
    account?.tenantId,
  ]);
  return systemMsg;
}
