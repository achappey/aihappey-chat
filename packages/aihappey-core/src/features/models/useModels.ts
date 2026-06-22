import { useEffect } from "react";
import { useAppStore } from "aihappey-state";
import { useSearchParams } from "react-router";
import { listModelsWithSplitProviderHeaders } from "../provider-credentials/providerAuthHeaders";

export const useModels = (
  modelsApi: string,
  getAccessToken?: () => Promise<string>
) => {
  const models = useAppStore(a => a.models);
  const modelsLoaded = useAppStore(a => a.modelsLoaded);
  const setModels = useAppStore(a => a.setModels)
  const customHeaders = useAppStore(a => a.customHeaders)
  const setModelsLoadingProgress = useAppStore((a: any) => a.setModelsLoadingProgress)
  const setSelectedModel = useAppStore(a => a.setSelectedModel)
  const userPreferredModel = useAppStore(a => a.userPreferredModel)
  const [searchParams] = useSearchParams();

  const model = searchParams.get("model");

  useEffect(() => {
    if (!modelsLoaded) {
      listModelsWithSplitProviderHeaders({
        modelsApi,
        getAccessToken,
        customHeaders,
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
          setModelsLoadingProgress?.(undefined)
          console.error("Failed to load models:", err);
        })
    }

  }, [modelsApi, getAccessToken, customHeaders, modelsLoaded, model, userPreferredModel, setModels, setSelectedModel, setModelsLoadingProgress]);

  useEffect(() => {
    if (!modelsLoaded || !model) return;

    setSelectedModel(model);
  }, [modelsLoaded, model, setSelectedModel]);
};
