import React from "react";
import { ModelSelectField } from "aihappey-components";
import { useAppStore } from "aihappey-state";
import type { ModelOption } from "aihappey-types";
import { useIsDesktop } from "../../shell/responsive/useIsDesktop";
import { useTranslation } from "aihappey-i18n";
import { useProviderRegistry } from "../../runtime/providers/useProviderRegistry";

type ProviderOption = { key: string; label: string };

const newestModelOfTypes = (models: ModelOption[], modelTypes: string[]) => {
  const candidates = (models ?? []).filter((model) => modelTypes.includes(model.type));
  return candidates
    .map((model, index) => ({ model, index }))
    .sort((a, b) => (b.model.created ?? 0) - (a.model.created ?? 0) || a.index - b.index)[0]
    ?.model;
};

interface ModelSelectProps {
  models: ModelOption[];
  value: string;
  label?: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  required?: boolean;
  modelTypes?: string[];
  autoSelectFallback?: boolean;
  style?: React.CSSProperties;
}

export const ModelSelect: React.FC<ModelSelectProps> = (props) => {
  const { autoSelectFallback = true, ...fieldProps } = props;
  const { t } = useTranslation();
  const isDesktop = useIsDesktop();
  const providers = useProviderRegistry();
  const providerOptions: ProviderOption[] = React.useMemo(
    () => {
      const routeByProvider = new Map<string, Set<string>>();
      for (const model of props.models ?? []) {
        const providerKey = ((model as any).sourceProviderKey ?? (model as any).providerKey ?? model.id?.split("/")?.[0])?.toLowerCase();
        if (!providerKey) continue;
        const route = (model as any).route === "direct" ? "direct" : "gateway";
        (routeByProvider.get(providerKey) ?? routeByProvider.set(providerKey, new Set()).get(providerKey)!)
          .add(route);
      }

      return Object.entries(providers).flatMap(([key, meta]) => {
        const routes = routeByProvider.get(key) ?? new Set<string>();
        if (routes.has("gateway") && routes.has("direct")) {
          return [
            { key: `${key}:gateway`, label: `${meta.name} (gateway)` },
            { key: `${key}:direct`, label: `${meta.name} (direct)` },
          ];
        }

        return [{ key, label: meta.name }];
      });
    },
    [providers, props.models],
  );
  const providerNameToKey = React.useMemo(
    () => Object.entries(providers).reduce((acc, [key, meta]) => {
      acc[meta.name] = key;
      return acc;
    }, {} as Record<string, string>),
    [providers],
  );

  const enabledProvidersByType = useAppStore((s) => s.enabledProvidersByType);
  const modelsLoaded = useAppStore((s) => s.modelsLoaded);
  const favoriteModelsByType = useAppStore((s: any) => s.favoriteModelsByType as Record<string, string[]> | undefined);
  const modelTypes = React.useMemo(() => props.modelTypes ?? ["language"], [props.modelTypes]);
  const enabledProviderKeys = React.useMemo(() => {
    const types = modelTypes;
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
  }, [enabledProvidersByType, modelTypes]);

  const favoriteModelIds = React.useMemo(() => {
    const types = modelTypes;
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
  }, [favoriteModelsByType, modelTypes]);

  React.useEffect(() => {
    if (!modelsLoaded) return;
    if (!autoSelectFallback) return;

    const currentValue = props.value;
    const currentExists = !!currentValue && props.models.some((model) =>
      model.id === currentValue && modelTypes.includes(model.type),
    );

    if (currentExists) return;

    const fallbackModel = newestModelOfTypes(props.models, modelTypes);
    const nextValue = fallbackModel?.id ?? "";
    if (currentValue !== nextValue) {
      props.onChange(nextValue);
    }
  }, [autoSelectFallback, modelTypes, modelsLoaded, props.models, props.onChange, props.value]);

  return (
    <ModelSelectField
      {...fieldProps}
      models={(props.models ?? [])}
      providers={providerOptions}
      enabledProviderKeys={enabledProviderKeys}
      favoriteModelIds={favoriteModelIds}
      favoritesLabel={t("favorites")}
      placeholder={t("selectModelPlaceholder")}
      searchPlaceholder={t("searchPlaceholder")}
      searchable
    />
  );
};
