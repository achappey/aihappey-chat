import React from "react";
import type { ModelOption } from "aihappey-types";
import { useTheme } from "../theme/ThemeContext";

export type ProviderOption = {
  key: string;   // "openai"
  label: string; // "OpenAI"
};

export type ModelSelectFieldProps = {
  models: ModelOption[];
  value: string;
  onChange: (id: string) => void;

  providers: ProviderOption[];
  enabledProviderKeys?: string[]; // optional filter
  modelTypes?: string[];          // default ["language"]

  label?: string;
  placeholder?: string;

  disabled?: boolean;
  icon?: string;
  size?: "small" | "medium" | "large";

  minWidth?: number;
  style?: React.CSSProperties;
  ariaLabel?: string;
};

export const ModelSelectField: React.FC<ModelSelectFieldProps> = ({
  models,
  value,
  onChange,

  providers,
  enabledProviderKeys,
  modelTypes = ["language"],

  label,
  placeholder = "Select a model",

  disabled,
  icon = "brain",
  size = "large",

  minWidth = 260,
  style,
  ariaLabel = "Model",
}) => {
  const { Select } = useTheme();
  const SelectComponent = Select || "select";

  const enabledSet = enabledProviderKeys?.length
    ? new Set(enabledProviderKeys)
    : null;

  const visibleModels = (models ?? []).filter((m) => {
    if (!modelTypes.includes(m.type)) return false;
    const providerKey = m.id.split("/")[0];
    return !enabledSet || enabledSet.has(providerKey);
  });

  const providerLabelByKey = new Map(providers.map((p) => [p.key, p.label]));

  const grouped: Record<string, ModelOption[]> = {};
  const ungrouped: ModelOption[] = [];

  for (const model of visibleModels) {
    const providerKey = model.id.split("/")[0];
    if (providerLabelByKey.has(providerKey)) {
      (grouped[providerKey] ??= []).push(model);
    } else {
      ungrouped.push(model);
    }
  }

  const displayValue = models?.find((m) => m.id === value)?.name ?? value;

  return (
    <SelectComponent
      values={[value]}
      valueTitle={displayValue}
      icon={icon}
      required
      label={label}
      size={size}
      placeholder={placeholder}
      disabled={disabled}
      aria-label={ariaLabel}
      style={{ minWidth, ...(style ?? {}) }}
      onChange={(e: React.ChangeEvent<HTMLSelectElement> | any) => {
        const selectedValue = e?.target?.value ?? e?.currentTarget?.value ?? e;
        onChange(selectedValue);
      }}
    >
      <>
        {Object.entries(grouped).map(([providerKey, list]) => (
          <optgroup key={providerKey} label={providerLabelByKey.get(providerKey) ?? providerKey}>
            {list.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </optgroup>
        ))}

        {ungrouped.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </>
    </SelectComponent>
  );
};
