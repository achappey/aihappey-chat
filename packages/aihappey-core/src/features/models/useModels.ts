import { useEffect } from "react";
import { createHttpClient } from "aihappey-http";
import type { ModelResponse } from "aihappey-types";
import { useAppStore } from "aihappey-state";
import { useSearchParams } from "react-router";

export const useModels = (
  modelsApi: string,
  getAccessToken?: () => Promise<string>
) => {
  const models = useAppStore(a => a.models);
  const modelsLoaded = useAppStore(a => a.modelsLoaded);
  const setModels = useAppStore(a => a.setModels)
  const customHeaders = useAppStore(a => a.customHeaders)
  const setSelectedModel = useAppStore(a => a.setSelectedModel)
  const userPreferredModel = useAppStore(a => a.userPreferredModel)
  const [searchParams] = useSearchParams();

  const model = searchParams.get("model");

  useEffect(() => {
    if (!modelsLoaded) {
      const client = createHttpClient({ getAccessToken, headers: customHeaders });
      client
        .get<ModelResponse>(modelsApi)
        .then((a) => {
          setModels(a.data)

          const defaultModel = model ?? userPreferredModel
          if (defaultModel)
            setSelectedModel(defaultModel)
        })
    }

  }, [modelsApi, getAccessToken, customHeaders, modelsLoaded, model, userPreferredModel, setModels, setSelectedModel]);

  useEffect(() => {
    if (!modelsLoaded || !model) return;

    setSelectedModel(model);
  }, [modelsLoaded, model, setSelectedModel]);
};
