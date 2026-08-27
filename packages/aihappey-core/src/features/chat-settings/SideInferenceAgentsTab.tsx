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
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {renderSelect(
        "welcomeMessageAgent",
        t("sideInference.welcomeMessageAgent"),
        t("sideInference.welcomeMessageAgentHint"),
      )}
      {renderSelect(
        "conversationNameAgent",
        t("sideInference.conversationNameAgent"),
        t("sideInference.conversationNameAgentHint"),
      )}
      {renderSelect(
        "explainToolCallAgent",
        t("sideInference.explainToolCallAgent"),
        t("sideInference.explainToolCallAgentHint"),
      )}
      {renderSelect(
        "toolSearchAgent",
        t("sideInference.toolSearchAgent"),
        t("sideInference.toolSearchAgentHint"),
      )}
      {renderSelect(
        "resourceSearchAgent",
        t("sideInference.resourceSearchAgent"),
        t("sideInference.resourceSearchAgentHint"),
      )}
    </div>
  );
};
