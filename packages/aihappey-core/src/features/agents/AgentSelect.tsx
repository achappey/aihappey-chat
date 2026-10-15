import React from "react";
import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";

import { store, useAppStore } from "aihappey-state";
import { useIsDesktop } from "../../shell/responsive/useIsDesktop";
import type { Agent, RemoteAgentModel } from "aihappey-types";
import {
  buildAvailableAgentSelectionEntries,
  normalizeSelectedAgentKeys,
  resolveSelectedAgentEntries,
} from "./agentSelection";
import { useChatContext } from "../chat/context/ChatContext";
import { FAVORITE_AGENT_ROUTER } from "../chat/engine/favoriteRouter";
import { getAgentTags } from "./agentTags";

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
  style?: React.CSSProperties;
  allowFavoriteRouter?: boolean;
}

export const AgentSelect: React.FC<AgentSelectProps> = ({
  localAgents,
  remoteAgentModels,
  values,
  onChange,
  disabled,
  favoriteAgentIds = [],
  favoritesLabel,
  style,
  allowFavoriteRouter = false,
}) => {
  const { Select } = useTheme();
  const { t } = useTranslation();
  const { config: chatConfig } = useChatContext();
  const isDesktop = useIsDesktop();
  const SelectComponent = Select || "select";
  const enabledProviders = useAppStore((a) => a.enabledProvidersByType?.language ?? []);
  const preferredDecisionModel = useAppStore(s => s.userPreferredDecisionModel);
  const routerSelected = useAppStore(s => s.favoriteAgentRouter);
  const setSelectedAgents = useAppStore(s => s.setSelectedAgents);
  const deciding = useAppStore(s => s.favoriteRouterDeciding);
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
  const routerAvailable = allowFavoriteRouter && !!preferredDecisionModel && favoriteVisibleAgents.length >= 2;
  const tagGroups = new Map<string, typeof visibleAgents>();
  const untaggedAgents = visibleAgents.filter((agent) => {
    const tags = getAgentTags(agent.localAgent, agent.remoteAgentModel, agent.remoteAgentModel?.agent);
    tags.forEach((tag) => tagGroups.set(tag, [...(tagGroups.get(tag) ?? []), agent]));
    return tags.length === 0;
  });
  const localVisibleAgents = sortAgentsByLabel(untaggedAgents.filter((agent) => agent.kind === "local" && !favoriteSet.has(agent.key)));
  const remoteVisibleAgents = sortAgentsByLabel(untaggedAgents.filter((agent) => agent.kind === "remote" && !favoriteSet.has(agent.key)));

  return (
    <SelectComponent
      values={normalizedValues}
      icon={"robot"}
      valueTitle={[
        selectedEntries.map((entry) => entry.label).join(", "),
        allowFavoriteRouter && routerSelected ? t("favoriteAgentRouter", "Favorite agent router") : "",
      ].filter(Boolean).join(" · ")}
      multiselect={true}
      style={style}
      size="large"
      onChange={(e: React.ChangeEvent<HTMLSelectElement> | any) => {
        const selectedValue =
          e?.target?.value ?? e?.currentTarget?.value ?? e;
        if (allowFavoriteRouter) {
          store.setState({ favoriteAgentRouter: selectedValue === FAVORITE_AGENT_ROUTER });
          if (selectedValue === FAVORITE_AGENT_ROUTER) return;
          if (routerSelected) {
            // Exiting routing is a single manual selection, not a multiselect toggle.
            setSelectedAgents([selectedValue]);
            return;
          }
        }
        onChange(selectedValue);
      }}
      disabled={disabled || (allowFavoriteRouter && deciding)}
      aria-label="Agent"
      searchable
      searchPlaceholder={t("searchPlaceholder")}
    >
      <>
        {routerAvailable && (
          <option value={FAVORITE_AGENT_ROUTER}>{t("favoriteAgentRouter", "Favorite agent router")}</option>
        )}
        {favoriteVisibleAgents.length > 0 && (
          <optgroup label={favoritesLabel ?? t("favorites")}>
            {favoriteVisibleAgents.map((agent) => (
              <option key={agent.key} value={agent.key}>
                {agent.label}
              </option>
            ))}
          </optgroup>
        )}

        {[...tagGroups].sort(([a], [b]) => a.localeCompare(b)).map(([tag, agents]) => (
          <optgroup key={`tag:${tag}`} label={tag}>
            {sortAgentsByLabel(agents).map((agent) => (
              <option key={agent.key} value={agent.key}>{agent.label}</option>
            ))}
          </optgroup>
        ))}

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
