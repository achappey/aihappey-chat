import { useEffect } from "react";
import { createHttpClient } from "aihappey-http";
import type { ModelResponse } from "aihappey-types";
import { useAppStore } from "aihappey-state";

export const useModels = (
  modelsApi: string,
  getAccessToken?: () => Promise<string>
) => {
  const models = useAppStore(a => a.models);
  const setModels = useAppStore(a => a.setModels)
  const customHeaders = useAppStore(a => a.customHeaders)

  useEffect(() => {
    if (models?.length == 0) {
      const client = createHttpClient({ getAccessToken, headers: customHeaders });
      client
        .get<ModelResponse>(modelsApi)
        .then((a) => setModels(a.data))
    }
  }, [modelsApi, getAccessToken, customHeaders]);
};