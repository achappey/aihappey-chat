import React from "react";
import { useTheme } from "aihappey-components";

import { useMediaQuery } from "usehooks-ts";
import { useAppStore } from "aihappey-state";
import { useIsDesktop } from "../../shell/responsive/useIsDesktop";
import type { Agent, RemoteAgentModel } from "aihappey-types";
import {
  buildAvailableAgentSelectionEntries,
  normalizeSelectedAgentKeys,
  resolveSelectedAgentEntries,
} from "./agentSelection";

interface AgentSelectProps {
  localAgents: Agent[];
  remoteAgentModels: RemoteAgentModel[];
  values: string[];
  onChange: (id: string) => void;
  disabled?: boolean;
}

export const AgentSelect: React.FC<AgentSelectProps> = ({
  localAgents,
  remoteAgentModels,
  values,
  onChange,
  disabled,
}) => {
  const { Select } = useTheme();
  const isDesktop = useIsDesktop();
  const SelectComponent = Select || "select";
  const enabledProviders = useAppStore((a) => a.enabledProvidersByType?.language ?? []);
  const visibleAgents = buildAvailableAgentSelectionEntries(
    localAgents,
    remoteAgentModels,
    enabledProviders,
  );
  const normalizedValues = normalizeSelectedAgentKeys(values, localAgents, remoteAgentModels);
  const selectedEntries = resolveSelectedAgentEntries(values, localAgents, remoteAgentModels);

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
      {(
        visibleAgents.map((agent) => (
          <option key={agent.key} value={agent.key}>
            {agent.label}
          </option>
        ))
      )}

    </SelectComponent>
  );
};
