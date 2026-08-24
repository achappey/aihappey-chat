import React from "react";
import type { ModelOption } from "aihappey-types";
import { getModelDisplayName, getModelProviderKey as getSharedModelProviderKey } from "aihappey-types";
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
  favoriteModelIds?: string[];
  favoritesLabel?: string;

  label?: string;
  placeholder?: string;

  disabled?: boolean;
  required?: boolean;
  icon?: string;
  size?: "small" | "medium" | "large";

  minWidth?: number;
  style?: React.CSSProperties;
  ariaLabel?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  noResultsText?: string;
};

const getModelProviderKey = (model: ModelOption) => {
  return getSharedModelProviderKey(model.id, model);
};

const getModelRouteProviderKey = (model: ModelOption) => {
  const providerKey = getModelProviderKey(model);
  const route = (model as any).route === "direct" ? "direct" : "gateway";
  return providerKey ? `${providerKey}:${route}` : providerKey;
};

const getModelOptionValue = (model: ModelOption) => JSON.stringify([model.type, model.id]);

export const ModelSelectField: React.FC<ModelSelectFieldProps> = ({
  models,
  value,
  onChange,

  providers,
  enabledProviderKeys,
  modelTypes = ["language"],
  favoriteModelIds,
  favoritesLabel = "Favorites",

  label,
  placeholder = "Select a model",

  disabled,
  required,
  icon = "brain",
  size = "large",

  minWidth = 260,
  style,
  ariaLabel = "Model",
  searchable = false,
  searchPlaceholder = "Search models...",
  noResultsText = "No results",
}) => {
  const { Select } = useTheme();
  const SelectComponent = Select || "select";

  const enabledSet = enabledProviderKeys?.length
    ? new Set(enabledProviderKeys)
    : null;

  const favoriteSet = new Set((favoriteModelIds ?? []).filter(Boolean));

  const visibleModels = (models ?? []).filter((m) => {
    if (!modelTypes.includes(m.type)) return false;

    // Favorites must always remain visible even if provider is currently disabled.
    if (favoriteSet.has(m.id)) return true;

    const providerKey = getModelProviderKey(m);
    return !enabledSet || (!!providerKey && enabledSet.has(providerKey));
  });

  const providerLabelByKey = new Map(providers.map((p) => [p.key, p.label]));
  const favoriteModels = visibleModels.filter((model) => favoriteSet.has(model.id));

  const grouped: Record<string, ModelOption[]> = {};
  const ungrouped: ModelOption[] = [];

  for (const model of visibleModels) {
    if (favoriteSet.has(model.id)) continue;
    const providerKey = providerLabelByKey.has(getModelRouteProviderKey(model) ?? "")
      ? getModelRouteProviderKey(model)
      : getModelProviderKey(model);
    if (providerKey && providerLabelByKey.has(providerKey)) {
      (grouped[providerKey] ??= []).push(model);
    } else {
      ungrouped.push(model);
    }
  }

  const modelIdByOptionValue = new Map(
    visibleModels.map((model) => [getModelOptionValue(model), model.id]),
  );
  const selectedModel = visibleModels.find((model) => model.id === value)
    ?? models?.find((model) => model.id === value);
  const selectedOptionValue = selectedModel && visibleModels.includes(selectedModel)
    ? getModelOptionValue(selectedModel)
    : value;
  const displayValue = getModelDisplayName(selectedModel, value);

  return (
    <SelectComponent
      values={[selectedOptionValue]}
      valueTitle={displayValue}
      icon={icon}
      label={label}
      size={size}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      aria-label={ariaLabel}
      searchable={searchable}
      searchPlaceholder={searchPlaceholder}
      noResultsText={noResultsText}
      style={{ ...(style ?? {}) }}
      onChange={(e: React.ChangeEvent<HTMLSelectElement> | any) => {
        const selectedValue = e?.target?.value ?? e?.currentTarget?.value ?? e;
        onChange(modelIdByOptionValue.get(selectedValue) ?? selectedValue);
      }}
    >
      <>
        {favoriteModels.length > 0 && (
          <optgroup label={favoritesLabel}>
            {favoriteModels.map((model) => (
              <option key={getModelOptionValue(model)} value={getModelOptionValue(model)}>
                {getModelDisplayName(model)}
              </option>
            ))}
          </optgroup>
        )}

        {Object.entries(grouped).map(([providerKey, list]) => (
          <optgroup key={providerKey} label={providerLabelByKey.get(providerKey) ?? providerKey}>
            {list.map((model) => (
              <option key={getModelOptionValue(model)} value={getModelOptionValue(model)}>
                {getModelDisplayName(model)}
              </option>
            ))}
          </optgroup>
        ))}

        {ungrouped.map((model) => (
          <option key={getModelOptionValue(model)} value={getModelOptionValue(model)}>
            {getModelDisplayName(model)}
          </option>
        ))}
      </>
    </SelectComponent>
  );
};
