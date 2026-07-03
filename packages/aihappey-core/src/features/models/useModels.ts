import { useEffect, useRef, useState } from "react";
import { store as appStore, useAppStore } from "aihappey-state";
import { useSearchParams } from "react-router";
import { listModelsWithSplitProviderHeaders } from "../provider-credentials/providerAuthHeaders";
import type { ModelOption } from "aihappey-types";
import { useProviderRegistry } from "../../runtime/providers/useProviderRegistry";

const modelRouteOf = (model: ModelOption): "gateway" | "direct" =>
  (model as any)?.route === "direct" ? "direct" : "gateway";

const equivalentModelIds = (model: ModelOption) => [
  model.id,
  (model as any).displayId,
  (model as any).providerModelId,
].filter((value): value is string => typeof value === "string" && value.trim().length > 0);

const resolveSelectableModelId = (
  models: ModelOption[],
  value?: string | null,
  preferredRoute?: "gateway" | "direct",
) => {
  const requested = String(value ?? "").trim();
  if (!requested) return undefined;

  const exact = models.find((item) => item.id === requested);
  if (exact) return exact.id;

  const matches = models.filter((item) => equivalentModelIds(item).includes(requested));
  if (matches.length === 0) return undefined;

  const routeMatch = preferredRoute
    ? matches.find((item) => modelRouteOf(item) === preferredRoute)
    : undefined;
  if (routeMatch) return routeMatch.id;

  const gatewayMatch = matches.find((item) => modelRouteOf(item) === "gateway");
  if (gatewayMatch) return gatewayMatch.id;

  return matches.length === 1 ? matches[0].id : undefined;
};

const newestModelOfType = (models: ModelOption[], type?: string) => {
  const candidates = models.filter((item) => !type || item.type === type);
  return candidates
    .map((item, index) => ({ item, index }))
    .sort((a, b) => (b.item.created ?? 0) - (a.item.created ?? 0) || a.index - b.index)[0]
    ?.item;
};

const modelTypeFor = (models: ModelOption[] | undefined, modelId?: string) =>
  modelId ? models?.find((item) => item.id === modelId)?.type : undefined;

export const useModels = (
  modelsApi: string,
  getAccessToken?: () => Promise<string>,
  options?: { gatewayEnabled?: boolean }
) => {
  const models = useAppStore(a => a.models);
  const modelsLoaded = useAppStore(a => a.modelsLoaded);
  const setModels = useAppStore(a => a.setModels)
  const resetModels = useAppStore(a => a.resetModels)
  const customHeaders = useAppStore(a => a.customHeaders)
  const effectiveChatEndpointMode = useAppStore(a => a.effectiveChatEndpointMode)
  const gatewayEnabled = options?.gatewayEnabled !== false;
  const setModelsLoadingProgress = useAppStore((a: any) => a.setModelsLoadingProgress)
  const setSelectedModel = useAppStore(a => a.setSelectedModel)
  const userPreferredModel = useAppStore(a => a.userPreferredModel)
  const selectedModel = useAppStore(a => a.selectedModel)
  const [searchParams] = useSearchParams();
  const lastSelectionRef = useRef<{ selectedModel?: string; models?: ModelOption[] }>({});
  const providers = useProviderRegistry();
  const [storeHydrated, setStoreHydrated] = useState(() =>
    (appStore as any).persist?.hasHydrated?.() ?? true,
  );

  const model = searchParams.get("model");

  useEffect(() => {
    const persistApi = (appStore as any).persist;
    if (!persistApi || persistApi.hasHydrated?.()) {
      setStoreHydrated(true);
      return;
    }

    return persistApi.onFinishHydration?.(() => setStoreHydrated(true));
  }, []);

  useEffect(() => {
    if (selectedModel || (models?.length ?? 0) > 0) {
      lastSelectionRef.current = { selectedModel, models };
    }
  }, [models, selectedModel]);

  useEffect(() => {
    if (storeHydrated && !modelsLoaded) {
      listModelsWithSplitProviderHeaders({
        modelsApi,
        getAccessToken,
        customHeaders,
        directProviderModels: true,
        includeGatewayModels: gatewayEnabled,
        providers,
        onProgress: setModelsLoadingProgress,
      })
        .then((a) => {
          const loadedModels = a.data ?? [];
          setModels(loadedModels)
          setModelsLoadingProgress?.(undefined)

          const preferredModel = model ?? selectedModel ?? userPreferredModel;
          const resolvedPreferredModel = resolveSelectableModelId(loadedModels, preferredModel, model ? undefined : "gateway");
          if (resolvedPreferredModel) {
            setSelectedModel(resolvedPreferredModel);
            return;
          }

          const previousModels = lastSelectionRef.current.models;
          const previousType = modelTypeFor(previousModels, preferredModel)
            ?? modelTypeFor(previousModels, lastSelectionRef.current.selectedModel)
            ?? "language";
          const fallbackModel = newestModelOfType(loadedModels, previousType);
          setSelectedModel(fallbackModel?.id);
        })
        .catch((err) => {
          resetModels()
          setModelsLoadingProgress?.(undefined)
          console.error("Failed to load models:", err);
        })
    }

  }, [modelsApi, getAccessToken, customHeaders, modelsLoaded, model, selectedModel, effectiveChatEndpointMode, providers, userPreferredModel, setModels, resetModels, setSelectedModel, setModelsLoadingProgress, storeHydrated, gatewayEnabled]);

  useEffect(() => {
    if (!modelsLoaded || !model) return;

    setSelectedModel(resolveSelectableModelId(models ?? [], model) ?? model);
  }, [models, modelsLoaded, model, setSelectedModel]);
};
