import { useEffect, useRef, useState } from "react";
import { store as appStore, useAppStore } from "aihappey-state";
import { useSearchParams } from "react-router";
import { listModelsWithSplitProviderHeaders } from "../provider-credentials/providerAuthHeaders";
import type { ModelOption } from "aihappey-types";
import { useProviderRegistry } from "../../runtime/providers/useProviderRegistry";

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
  getAccessToken?: () => Promise<string>
) => {
  const models = useAppStore(a => a.models);
  const modelsLoaded = useAppStore(a => a.modelsLoaded);
  const setModels = useAppStore(a => a.setModels)
  const resetModels = useAppStore(a => a.resetModels)
  const customHeaders = useAppStore(a => a.customHeaders)
  const effectiveChatEndpointMode = useAppStore(a => a.effectiveChatEndpointMode)
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
        directProviderModels: effectiveChatEndpointMode === "direct" && !getAccessToken,
        providers,
        onProgress: setModelsLoadingProgress,
      })
        .then((a) => {
          const loadedModels = a.data ?? [];
          setModels(loadedModels)
          setModelsLoadingProgress?.(undefined)

          const preferredModel = model ?? selectedModel ?? userPreferredModel;
          const availableIds = new Set(loadedModels.map((item) => item.id));
          if (preferredModel && availableIds.has(preferredModel)) {
            setSelectedModel(preferredModel);
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

  }, [modelsApi, getAccessToken, customHeaders, modelsLoaded, model, selectedModel, effectiveChatEndpointMode, providers, userPreferredModel, setModels, resetModels, setSelectedModel, setModelsLoadingProgress, storeHydrated]);

  useEffect(() => {
    if (!modelsLoaded || !model) return;

    setSelectedModel(model);
  }, [modelsLoaded, model, setSelectedModel]);
};
