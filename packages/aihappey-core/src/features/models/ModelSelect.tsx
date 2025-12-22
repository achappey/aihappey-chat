import React from "react";
import { useTheme } from "aihappey-components";
import { useAppStore } from "aihappey-state";
import type { ModelOption } from "aihappey-types";
import { useIsDesktop } from "../../shell/responsive/useIsDesktop";
import { PROVIDERS } from "../../runtime/providers/providerMetadata";
import { useTranslation } from "aihappey-i18n";

interface ModelSelectProps {
  models: ModelOption[];
  value: string;
  label?: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

export const ModelSelect: React.FC<ModelSelectProps> = ({
  models,
  value,
  onChange,
  label,
  disabled,
}) => {
  const { Select } = useTheme();
  const isDesktop = useIsDesktop();
  const SelectComponent = Select || "select";
  const { t } = useTranslation();
  const enabledProviders = useAppStore((a) => a.enabledProviders);
  const providerNameToKey = Object.entries(PROVIDERS).reduce(
    (acc, [key, meta]) => {
      acc[meta.name] = key;
      return acc;
    },
    {} as Record<string, string>
  );

  const enabledProviderKeys = new Set(
    enabledProviders
      .map((name) => providerNameToKey[name])
      .filter(Boolean)
  );

  const visibleModels = models.filter(
    (m) =>
      m.type === "language" &&
      enabledProviderKeys.has(m.id.split("/")[0])
  );

  const grouped: Record<string, ModelOption[]> = {};
  const ungrouped: ModelOption[] = [];

  for (const model of visibleModels) {
    const providerKey = model.id.split("/")[0];
    const providerMeta = PROVIDERS[providerKey as keyof typeof PROVIDERS];

    if (providerMeta) {
      if (!grouped[providerKey]) grouped[providerKey] = [];
      grouped[providerKey].push(model);
    } else {
      ungrouped.push(model);
    }
  }

  const displayValue = models?.find(a => a.id == value)?.name ?? value

  return (
    <SelectComponent
      values={[value]}
      valueTitle={displayValue}
      icon="brain"
      required
      label={label}
      style={{ minWidth: isDesktop ? 260 : 200 }}
      size="large"
      placeholder={t('selectModelPlaceholder')}
      onChange={(e: React.ChangeEvent<HTMLSelectElement> | any) => {
        const selectedValue =
          e?.target?.value ?? e?.currentTarget?.value ?? e;
        onChange(selectedValue);
      }}
      disabled={disabled}
      aria-label="Model">
      <>
        {Object
          .entries(grouped)
          .map(([providerKey, list]) => (
            <optgroup
              key={providerKey}
              label={PROVIDERS[providerKey as keyof typeof PROVIDERS].name}
            >
              {list.map((model) => (
                <option key={model.id}
                  value={model.id}>
                  {model.name}
                </option>
              ))}
            </optgroup>
          ))}

        {ungrouped.map((model) => (
          <option key={model.id}
            value={model.id}>
            {model.name}
          </option>
        ))}
      </>
    </SelectComponent>
  );
};
