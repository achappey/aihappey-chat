import { useEffect, useRef } from "react";
import { useAppStore } from "aihappey-state";
import { useSearchParams } from "react-router";
import { listModelsWithSplitProviderHeaders } from "../provider-credentials/providerAuthHeaders";
import { resolveEndpointProfile } from "../chat/engine/endpointProfiles";
import type { ModelOption } from "aihappey-types";

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
  const configuredChatEndpoint = useAppStore(a => a.configuredChatEndpoint)
  const selectedEndpointProfileId = useAppStore(a => a.selectedEndpointProfileId)
  const selectedBaseUrl = useAppStore(a => a.selectedBaseUrl)
  const setModelsLoadingProgress = useAppStore((a: any) => a.setModelsLoadingProgress)
  const setSelectedModel = useAppStore(a => a.setSelectedModel)
  const userPreferredModel = useAppStore(a => a.userPreferredModel)
  const selectedModel = useAppStore(a => a.selectedModel)
  const [searchParams] = useSearchParams();
  const lastSelectionRef = useRef<{ selectedModel?: string; models?: ModelOption[] }>({});

  const model = searchParams.get("model");
  const endpointProfile = resolveEndpointProfile({
    selectedEndpointProfileId,
    selectedBaseUrl,
    configuredChatEndpoint,
  });
  const selectedProviderKey = endpointProfile?.kind === "provider"
    ? endpointProfile.providerKey
    : undefined;

  useEffect(() => {
    if (selectedModel || (models?.length ?? 0) > 0) {
      lastSelectionRef.current = { selectedModel, models };
    }
  }, [models, selectedModel]);

  useEffect(() => {
    if (!modelsLoaded) {
      listModelsWithSplitProviderHeaders({
        modelsApi,
        getAccessToken,
        customHeaders,
        providerKey: selectedProviderKey,
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

  }, [modelsApi, getAccessToken, customHeaders, modelsLoaded, model, selectedModel, selectedProviderKey, userPreferredModel, setModels, resetModels, setSelectedModel, setModelsLoadingProgress]);

  useEffect(() => {
    if (!modelsLoaded || !model) return;

    setSelectedModel(model);
  }, [modelsLoaded, model, setSelectedModel]);
};
