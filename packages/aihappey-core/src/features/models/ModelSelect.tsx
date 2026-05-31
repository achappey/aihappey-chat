import React from "react";
import { ModelSelectField } from "aihappey-components";
import { useAppStore } from "aihappey-state";
import type { ModelOption } from "aihappey-types";
import { useIsDesktop } from "../../shell/responsive/useIsDesktop";
import { PROVIDERS } from "../../runtime/providers/providerMetadata";
import { useTranslation } from "aihappey-i18n";

type ProviderOption = { key: string; label: string };

const providerOptions: ProviderOption[] = Object.entries(PROVIDERS).map(([key, meta]) => ({
  key,
  label: meta.name,
}));

const providerNameToKey = Object.entries(PROVIDERS).reduce((acc, [key, meta]) => {
  acc[meta.name] = key;
  return acc;
}, {} as Record<string, string>);

interface ModelSelectProps {
  models: ModelOption[];
  value: string;
  label?: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  modelTypes?: string[];
}

export const ModelSelect: React.FC<ModelSelectProps> = (props) => {
  const { t } = useTranslation();
  const isDesktop = useIsDesktop();

  const enabledProvidersByType = useAppStore((s) => s.enabledProvidersByType);
  const favoriteModelsByType = useAppStore((s: any) => s.favoriteModelsByType as Record<string, string[]> | undefined);
  const enabledProviderKeys = React.useMemo(() => {
    const types = props.modelTypes ?? ["language"];
    const names = new Set<string>();
    for (const type of types) {
      const bucket = (enabledProvidersByType as any)?.[type]
        ?? (type === "audio" ? (enabledProvidersByType as any)?.realtime : undefined)
        ?? [];
      for (const name of bucket) {
        names.add(name);
      }
    }
    return Array.from(names).map((name) => providerNameToKey[name]).filter(Boolean);
  }, [enabledProvidersByType, props.modelTypes]);

  const favoriteModelIds = React.useMemo(() => {
    const types = props.modelTypes ?? ["language"];
    const all = new Set<string>();

    for (const type of types) {
      const bucket = favoriteModelsByType?.[type]
        ?? (type === "audio" ? favoriteModelsByType?.realtime : undefined)
        ?? [];

      for (const modelId of bucket) {
        if (modelId) all.add(modelId);
      }
    }

    return Array.from(all);
  }, [favoriteModelsByType, props.modelTypes]);

  return (
    <ModelSelectField
      {...props}
      providers={providerOptions}
      enabledProviderKeys={enabledProviderKeys}
      favoriteModelIds={favoriteModelIds}
      favoritesLabel={t("favorites")}
      placeholder={t("selectModelPlaceholder")}
      minWidth={isDesktop ? 260 : 170}
    />
  );
};
