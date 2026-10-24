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
  /** Opt-in saved selections that must remain available for explicit deselection. */
  selectedOptions?: ModelOption[];
  value: string;
  values?: string[];
  multiselect?: boolean;
  onChange: (id: string) => void;

  providers: ProviderOption[];
  enabledProviderKeys?: string[]; // optional filter
  enabledProviderKeysByType?: Record<string, string[]>;
  modelTypes?: string[];          // default ["language"]
  favoriteModelIds?: string[];
  favoritesLabel?: string;
  virtualOptions?: { id: string; label: string }[];
  valueTitle?: string;

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
  selectedOptions = [],
  value,
  values,
  multiselect = false,
  onChange,

  providers,
  enabledProviderKeys,
  enabledProviderKeysByType,
  modelTypes = ["language"],
  favoriteModelIds,
  favoritesLabel = "Favorites",
  virtualOptions = [],
  valueTitle,

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

  const enabledSet = enabledProviderKeys !== undefined
    ? new Set(enabledProviderKeys)
    : null;
  const enabledSetsByType = new Map(Object.entries(enabledProviderKeysByType ?? {})
    .map(([type, keys]) => [type, new Set(keys)]));

  const favoriteSet = new Set((favoriteModelIds ?? []).filter(Boolean));
  const selectedIds = multiselect ? values ?? [] : [value];

  const visibleModels = (models ?? []).filter((m) => {
    if (!modelTypes.includes(m.type)) return false;

    // Favorites must always remain visible even if provider is currently disabled.
    if (favoriteSet.has(m.id)) return true;

    const providerKey = getModelProviderKey(m);
    const enabled = enabledSetsByType.get(m.type) ?? enabledSet;
    return !enabled || (!!providerKey && enabled.has(providerKey));
  });
  // Agent editors need to uncheck saved models even when their provider is disabled
  // or the model is no longer in the catalog. Other pickers keep their normal filters.
  for (const model of selectedOptions) {
    if (selectedIds.includes(model.id) && !visibleModels.some(option => option.id === model.id)) {
      visibleModels.push(model);
    }
  }

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
  const visibleModelById = new Map(visibleModels.map(model => [model.id, model]));
  const modelById = new Map((models ?? []).map(model => [model.id, model]));
  const selectedOptionValues = selectedIds.map(id => {
    const model = visibleModelById.get(id);
    return model ? getModelOptionValue(model) : id;
  });
  const displayValue = selectedIds.map(id => getModelDisplayName(visibleModelById.get(id) ?? modelById.get(id), id)).join(", ");

  return (
    <SelectComponent
      values={selectedOptionValues}
      multiselect={multiselect}
      valueTitle={valueTitle ?? displayValue}
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
        {virtualOptions.map(option => (
          <option key={option.id} value={option.id}>{option.label}</option>
        ))}
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
