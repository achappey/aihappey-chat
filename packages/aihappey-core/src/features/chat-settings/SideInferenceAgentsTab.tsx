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
  ) => {
    const selected = value?.[key] ?? "";
    const selectedAgent = sortedAgents.find((agent) => agent.name === selected);

    return (
      <theme.Select
        label={label}
        values={[selected]}
        valueTitle={selected ? selectedAgent?.name ?? selected : t("none")}
        onChange={(next: string) => onChange({ ...value, [key]: next })}
      >
        <option value="">{t("none")}</option>
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
      )}
      {renderSelect(
        "conversationNameAgent",
        t("sideInference.conversationNameAgent"),
      )}
      {renderSelect(
        "explainToolCallAgent",
        t("sideInference.explainToolCallAgent"),
      )}
      {renderSelect(
        "toolSearchAgent",
        t("sideInference.toolSearchAgent"),
      )}
      {renderSelect(
        "resourceSearchAgent",
        t("sideInference.resourceSearchAgent"),
      )}
      {renderSelect(
        "selectModelAgent",
        t("sideInference.selectModelAgent"),
      )}
      {renderSelect(
        "selectFavoriteAgent",
        t("sideInference.selectFavoriteAgent"),
      )}
    </div>
  );
};
