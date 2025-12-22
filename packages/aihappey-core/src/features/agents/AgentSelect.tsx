import React from "react";
import { useTheme } from "aihappey-components";

import { useMediaQuery } from "usehooks-ts";
import { useAppStore } from "aihappey-state";
import { useIsDesktop } from "../../shell/responsive/useIsDesktop";
import type { Agent } from "aihappey-types";

interface AgentSelectProps {
  agents: Agent[];
  values: string[];
  onChange: (id: string) => void;
  disabled?: boolean;
}

export const AgentSelect: React.FC<AgentSelectProps> = ({
  agents,
  values,
  onChange,
  disabled,
}) => {
  const { Select } = useTheme();
  const isDesktop = useIsDesktop();
  const SelectComponent = Select || "select";
  const enabledProviders = useAppStore((a) => a.enabledProviders);
  const visibleAgents = agents.filter((m) =>
    enabledProviders.map(a => a.toLowerCase()).includes(m.model.id.split("/")[0])
  );

  return (
    <SelectComponent
      values={values}
      icon={"robot"}
      valueTitle={values.join(", ")}
      multiselect={true}
      style={{ minWidth: isDesktop ? 260 : 200 }}
      size="large"
      onChange={(e: React.ChangeEvent<HTMLSelectElement> | any) => {
        const selectedValue =
          e?.target?.value ?? e?.currentTarget?.value ?? e;
        onChange(selectedValue);
      }}
      disabled={disabled}
      aria-label="Model"
    >
      {(
        visibleAgents.map((model) => (
          <option key={model.name} value={model.name}>
            {model.name}
          </option>
        ))
      )}

    </SelectComponent>
  );
};
