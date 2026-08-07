import React from "react";
import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import type { Agent } from "aihappey-types";
import type { SideInferenceAgentNames } from "aihappey-state";

type SideInferenceAgentsTabProps = {
  agents: Agent[];
  value: SideInferenceAgentNames;
  onChange: (next: SideInferenceAgentNames) => void;
};

const sortAgentsByName = (agents: Agent[]) =>
  [...agents].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

export const SideInferenceAgentsTab: React.FC<SideInferenceAgentsTabProps> = ({
  agents,
  value,
  onChange,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const sortedAgents = React.useMemo(() => sortAgentsByName(agents ?? []), [agents]);

  const renderSelect = (
    key: keyof SideInferenceAgentNames,
    label: string,
    hint: string,
  ) => {
    const selected = value?.[key] ?? "";
    const selectedAgent = sortedAgents.find((agent) => agent.name === selected);

    return (
      <theme.Select
        label={label}
        values={[selected]}
        valueTitle={selectedAgent?.name ?? selected}
        onChange={(next: string) => onChange({ ...value, [key]: next })}
        disabled={sortedAgents.length === 0}
      >
        {selected && !selectedAgent ? (
          <option value={selected}>{selected}</option>
        ) : null}
        {sortedAgents.map((agent) => (
          <option key={agent.name} value={agent.name}>
            {agent.name}
          </option>
        ))}
      </theme.Select>
    );
  };

  return (
    <theme.Card
      size="small"
      title={t("sideInference.title") ?? "App Agents"}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {renderSelect(
          "welcomeMessageAgent",
          t("sideInference.welcomeMessageAgent") ?? "Welcome message agent",
          t("sideInference.welcomeMessageAgentHint") ?? "Choose the agent for welcome messages.",
        )}
        {renderSelect(
          "conversationNameAgent",
          t("sideInference.conversationNameAgent") ?? "Conversation name agent",
          t("sideInference.conversationNameAgentHint") ?? "Choose the agent for conversation names.",
        )}
        {renderSelect(
          "explainToolCallAgent",
          t("sideInference.explainToolCallAgent") ?? "Tool explanation agent",
          t("sideInference.explainToolCallAgentHint") ?? "Choose the agent for tool explanations.",
        )}
        {renderSelect(
          "toolSearchAgent",
          t("sideInference.toolSearchAgent") ?? "Tool search agent",
          t("sideInference.toolSearchAgentHint") ?? "Choose the agent that selects relevant tools for client tool search.",
        )}
      </div>
    </theme.Card>
  );
};
