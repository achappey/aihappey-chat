import { useMemo } from "react";
import { useAppStore } from "aihappey-state";
import { useAccount } from "aihappey-auth";
import { useTranslation } from "aihappey-i18n";
import { useDarkMode } from "usehooks-ts";
import { buildSystemMessage } from "./buildSystemMessage";
import { useUserLocation } from "../../../shell/connectors/useUserLocation";
import { useChatContext } from "../context/ChatContext";
import { useSkills } from "aihappey-skills";

export function useSystemMessage() {
  const mcpServerContent = useAppStore((s) => s.mcpServerContent);
  const systemInstructions = useAppStore((s) => s.systemInstructions);
  const accountLocation = useAppStore((s) => s.accountLocation);
  const enableUserLocation = useAppStore((s) => s.enableUserLocation);
  const mcpServers = useAppStore((s) => s.mcpServers);
  const enabledSkillIds = useAppStore((s) => s.enabledSkillIds);
  const account = useAccount();
  useUserLocation(enableUserLocation);
  const { isDarkMode } = useDarkMode();
  const { i18n } = useTranslation();
  const { config } = useChatContext();
  const skills = useSkills();
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
    const byId = new Map((skills.items ?? []).map((item) => [item.skillId, item] as const));
    return (enabledSkillIds ?? [])
      .map((skillId) => byId.get(skillId))
      .filter((item): item is (typeof skills.items)[number] => !!item)
      .map((item) => ({ skillId: item.skillId, name: item.name, description: item.description }));
  }, [enabledSkillIds, skills.items]);

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
        enabledSkills
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
  ]);
  return systemMsg;
}
