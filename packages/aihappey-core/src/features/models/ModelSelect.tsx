import React from "react";
import { ModelSelectField } from "aihappey-components";
import { useAppStore } from "aihappey-state";
import type { ModelOption } from "aihappey-types";
import { useIsDesktop } from "../../shell/responsive/useIsDesktop";
import { useTranslation } from "aihappey-i18n";
import { useProviderRegistry } from "../../runtime/providers/useProviderRegistry";
import { favoriteRouterModel, SELECT_ALL_FAVORITE_MODELS } from "../chat/engine/favoriteRouter";

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
  selectedOptions?: ModelOption[];
  value: string;
  values?: string[];
  multiselect?: boolean;
  label?: string;
  onChange: (id: string) => void;
  onValuesChange?: (ids: string[]) => void;
  disabled?: boolean;
  required?: boolean;
  modelTypes?: string[];
  autoSelectFallback?: boolean;
  allowFavoriteRouter?: boolean;
  style?: React.CSSProperties;
}

export const ModelSelect: React.FC<ModelSelectProps> = (props) => {
  const { autoSelectFallback = true, allowFavoriteRouter = false, onValuesChange, ...fieldProps } = props;
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
  const routingDecisionModel = useAppStore(s => favoriteRouterModel(s, "model"));
  const deciding = useAppStore(s => s.favoriteRouterDeciding);
  const modelTypes = React.useMemo(() => props.modelTypes ?? ["language"], [props.modelTypes]);
  const currentFavoriteIds = Array.from(new Set(props.models.filter(model => modelTypes.includes(model.type)
    && favoriteModelsByType?.[model.type]?.includes(model.id)).map(model => model.id)));
  const favoritesShortcutAvailable = allowFavoriteRouter && props.multiselect && !!routingDecisionModel
    && !!onValuesChange && currentFavoriteIds.length > 0;
  const enabledProviderKeysByType = React.useMemo(() => {
    return Object.fromEntries(modelTypes.map(type => {
      const bucket = (enabledProvidersByType as any)?.[type]
        ?? (type === "audio" ? (enabledProvidersByType as any)?.realtime : undefined)
        ?? [];
      return [type, bucket.map((name: string) => providerNameToKey[name]).filter(Boolean)];
    }));
  }, [enabledProvidersByType, modelTypes, providerNameToKey]);
  const enabledProviderKeys = React.useMemo(() => Array.from(new Set<string>(
    Object.values(enabledProviderKeysByType).flat(),
  )), [enabledProviderKeysByType]);

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
    if (props.multiselect) return;
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
  }, [autoSelectFallback, modelTypes, modelsLoaded, props.models, props.onChange, props.value, props.multiselect]);

  return (
    <ModelSelectField
      {...fieldProps}
      disabled={props.disabled || (allowFavoriteRouter && deciding)}
      virtualOptions={favoritesShortcutAvailable
        ? [{ id: SELECT_ALL_FAVORITE_MODELS, label: t("selectAllFavorites", "Select all favorites") }] : []}
      onChange={(id) => {
        if (id === SELECT_ALL_FAVORITE_MODELS) {
          if (favoritesShortcutAvailable) onValuesChange?.(currentFavoriteIds);
          return;
        }
        props.onChange(id);
      }}
      models={(props.models ?? [])}
      providers={providerOptions}
      enabledProviderKeys={enabledProviderKeys}
      enabledProviderKeysByType={enabledProviderKeysByType}
      favoriteModelIds={favoriteModelIds}
      favoritesLabel={t("favorites")}
      placeholder={t("selectModelPlaceholder")}
      searchPlaceholder={t("searchPlaceholder")}
      searchable
    />
  );
};
