import React from "react";
import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";

import { useAppStore } from "aihappey-state";
import { useIsDesktop } from "../../shell/responsive/useIsDesktop";
import type { Agent, RemoteAgentModel } from "aihappey-types";
import {
  buildAvailableAgentSelectionEntries,
  normalizeSelectedAgentKeys,
  resolveSelectedAgentEntries,
} from "./agentSelection";
import { useChatContext } from "../chat/context/ChatContext";

const hostnameOf = (url?: string) => {
  if (!url) return "remote";
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

const sortAgentsByLabel = <T extends { label: string }>(agents: T[]) =>
  [...agents].sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));

interface AgentSelectProps {
  localAgents: Agent[];
  remoteAgentModels: RemoteAgentModel[];
  values: string[];
  onChange: (id: string) => void;
  disabled?: boolean;
  favoriteAgentIds?: string[];
  favoritesLabel?: string;
}

export const AgentSelect: React.FC<AgentSelectProps> = ({
  localAgents,
  remoteAgentModels,
  values,
  onChange,
  disabled,
  favoriteAgentIds = [],
  favoritesLabel,
}) => {
  const { Select } = useTheme();
  const { t } = useTranslation();
  const { config: chatConfig } = useChatContext();
  const isDesktop = useIsDesktop();
  const SelectComponent = Select || "select";
  const enabledProviders = useAppStore((a) => a.enabledProvidersByType?.language ?? []);
  const visibleAgents = buildAvailableAgentSelectionEntries(
    localAgents,
    remoteAgentModels,
    enabledProviders,
    favoriteAgentIds,
  );
  const normalizedValues = normalizeSelectedAgentKeys(values, localAgents, remoteAgentModels);
  const selectedEntries = resolveSelectedAgentEntries(values, localAgents, remoteAgentModels);
  const remoteAgentsHost = React.useMemo(
    () => hostnameOf(chatConfig.agentEndpoint ? `${chatConfig.agentEndpoint}${chatConfig.endpoints.models}` : undefined),
    [chatConfig.agentEndpoint, chatConfig.endpoints.models]
  );
  const favoriteSet = React.useMemo(
    () => new Set((favoriteAgentIds ?? []).filter(Boolean)),
    [favoriteAgentIds]
  );
  const favoriteVisibleAgents = sortAgentsByLabel(visibleAgents.filter((agent) => favoriteSet.has(agent.key)));
  const localVisibleAgents = sortAgentsByLabel(visibleAgents.filter((agent) => agent.kind === "local" && !favoriteSet.has(agent.key)));
  const remoteVisibleAgents = sortAgentsByLabel(visibleAgents.filter((agent) => agent.kind === "remote" && !favoriteSet.has(agent.key)));

  return (
    <SelectComponent
      values={normalizedValues}
      icon={"robot"}
      valueTitle={selectedEntries.map((entry) => entry.label).join(", ")}
      multiselect={true}
      style={{ minWidth: isDesktop ? 260 : 200 }}
      size="large"
      onChange={(e: React.ChangeEvent<HTMLSelectElement> | any) => {
        const selectedValue =
          e?.target?.value ?? e?.currentTarget?.value ?? e;
        onChange(selectedValue);
      }}
      disabled={disabled}
      aria-label="Agent"
    >
      <>
        {favoriteVisibleAgents.length > 0 && (
          <optgroup label={favoritesLabel ?? t("favorites")}>
            {favoriteVisibleAgents.map((agent) => (
              <option key={agent.key} value={agent.key}>
                {agent.label}
              </option>
            ))}
          </optgroup>
        )}

        {remoteVisibleAgents.length > 0 && (
          <optgroup label={remoteAgentsHost}>
            {remoteVisibleAgents.map((agent) => (
              <option key={agent.key} value={agent.key}>
                {agent.label}
              </option>
            ))}
          </optgroup>
        )}

        {localVisibleAgents.length > 0 && (
          <optgroup label="Local">
            {localVisibleAgents.map((agent) => (
              <option key={agent.key} value={agent.key}>
                {agent.label}
              </option>
            ))}
          </optgroup>
        )}
      </>

    </SelectComponent>
  );
};
