import { useEffect } from "react";
import { createHttpClient } from "aihappey-http";
import type { RemoteAgentModel } from "aihappey-types";
import { useAppStore } from "aihappey-state";

const normalizeRemoteAgentModel = (value: any): RemoteAgentModel => ({
  id: String(value?.id ?? ""),
  name: typeof value?.name === "string" && value.name.trim() ? value.name : String(value?.id ?? ""),
  description: typeof value?.description === "string" ? value.description : undefined,
  created: typeof value?.created === "number" ? value.created : undefined,
  owned_by: typeof value?.owned_by === "string" ? value.owned_by : undefined,
  tags: Array.isArray(value?.tags) ? value.tags.map((tag: any) => String(tag)) : ["remote", "agent"],
  source: "remote",
});

export const useRemoteAgentModels = (
  modelsApi?: string,
  getAccessToken?: () => Promise<string>
) => {
  const remoteAgentModelsLoaded = useAppStore((s) => s.remoteAgentModelsLoaded);
  const setRemoteAgentModels = useAppStore((s) => s.setRemoteAgentModels);
  const customHeaders = useAppStore((s) => s.customHeaders);

  useEffect(() => {
    if (!modelsApi || remoteAgentModelsLoaded) return;

    const client = createHttpClient({ getAccessToken, headers: customHeaders });

    client
      .get<any>(modelsApi)
      .then((response) => {
        const remoteModels = Array.isArray(response?.data)
          ? response.data
            .filter((item: any) => item?.id)
            .map(normalizeRemoteAgentModel)
          : [];

        setRemoteAgentModels(remoteModels);
      })
      .catch(() => {
        setRemoteAgentModels([]);
      });
  }, [modelsApi, getAccessToken, customHeaders, remoteAgentModelsLoaded]);
};
