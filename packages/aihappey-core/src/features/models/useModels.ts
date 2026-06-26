import { useEffect } from "react";
import { useAppStore } from "aihappey-state";
import { useSearchParams } from "react-router";
import { listModelsWithSplitProviderHeaders } from "../provider-credentials/providerAuthHeaders";
import { resolveEndpointProfile } from "../chat/engine/endpointProfiles";

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
  const [searchParams] = useSearchParams();

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
    if (!modelsLoaded) {
      listModelsWithSplitProviderHeaders({
        modelsApi,
        getAccessToken,
        customHeaders,
        providerKey: selectedProviderKey,
        onProgress: setModelsLoadingProgress,
      })
        .then((a) => {
          setModels(a.data)
          setModelsLoadingProgress?.(undefined)

          const defaultModel = model ?? userPreferredModel
          if (defaultModel)
            setSelectedModel(defaultModel)
        })
        .catch((err) => {
          resetModels()
          setModelsLoadingProgress?.(undefined)
          console.error("Failed to load models:", err);
        })
    }

  }, [modelsApi, getAccessToken, customHeaders, modelsLoaded, model, selectedProviderKey, userPreferredModel, setModels, resetModels, setSelectedModel, setModelsLoadingProgress]);

  useEffect(() => {
    if (!modelsLoaded || !model) return;

    setSelectedModel(model);
  }, [modelsLoaded, model, setSelectedModel]);
};
