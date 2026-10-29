import { useEffect, useRef } from "react";
import { createHttpClient } from "aihappey-http";
import { createEndpointHeaders } from "../provider-credentials/providerAuthHeaders";
import type { RemoteAgentModel } from "aihappey-types";
import { useAppStore } from "aihappey-state";

const normalizeRemoteAgentModel = (value: any): RemoteAgentModel => ({
  id: String(value?.id ?? ""),
  name: typeof value?.name === "string" && value.name.trim() ? value.name : String(value?.id ?? ""),
  description: typeof value?.description === "string" ? value.description : undefined,
  created: typeof value?.created === "number" ? value.created : undefined,
  owned_by: typeof value?.owned_by === "string" ? value.owned_by : undefined,
  agent: value.agent,
  tags: Array.isArray(value?.tags) ? value.tags.filter((tag: unknown) => typeof tag === "string") : undefined,
  source: "remote",
});

export const useRemoteAgentModels = (
  modelsApi?: string,
  getAccessToken?: () => Promise<string>
) => {
  const remoteAgentModelsLoaded = useAppStore((s) => s.remoteAgentModelsLoaded);
  const setRemoteAgentModels = useAppStore((s) => s.setRemoteAgentModels);
  const customHeaders = useAppStore((s) => s.customHeaders);
  const getAccessTokenRef = useRef(getAccessToken);
  const pendingRequestRef = useRef<{
    key: string;
    promise: Promise<RemoteAgentModel[]>;
  } | undefined>(undefined);

  // Callback identity can change on startup renders (including token acquisition).
  // Keep the latest callback without treating its identity as a new request.
  useEffect(() => {
    getAccessTokenRef.current = getAccessToken;
  }, [getAccessToken]);

  const endpointHeaderEntries: [string, string][] = [];
  new Headers(createEndpointHeaders(customHeaders)).forEach((value, name) => {
    endpointHeaderEntries.push([name, value]);
  });
  const endpointHeadersKey = JSON.stringify(endpointHeaderEntries);
  const hasAccessToken = getAccessToken != null;

  useEffect(() => {
    if (!modelsApi || remoteAgentModelsLoaded) return;

    let cancelled = false;
    const key = JSON.stringify([modelsApi, endpointHeadersKey, hasAccessToken]);
    let request = pendingRequestRef.current;

    if (!request || request.key !== key) {
      const client = createHttpClient({
        getAccessToken: getAccessTokenRef.current,
        headers: Object.fromEntries(JSON.parse(endpointHeadersKey)),
      });
      const promise: Promise<RemoteAgentModel[]> = client
        .get<any>(modelsApi)
        .then((response) => Array.isArray(response?.data)
          ? response.data.filter((item: any) => item?.id).map(normalizeRemoteAgentModel)
          : [])
        .finally(() => {
          if (pendingRequestRef.current?.promise === promise) {
            pendingRequestRef.current = undefined;
          }
        });

      request = { key, promise };
      pendingRequestRef.current = request;
    }

    request.promise
      .then((remoteModels) => {
        if (!cancelled) setRemoteAgentModels(remoteModels);
      })
      .catch(() => {
        if (!cancelled) setRemoteAgentModels([]);
      });

    // Keep the pending promise for Strict Mode effect replay, but detach this
    // effect's result handler on cleanup so obsolete responses cannot commit.
    return () => {
      cancelled = true;
    };
  }, [modelsApi, endpointHeadersKey, hasAccessToken, remoteAgentModelsLoaded, setRemoteAgentModels]);
};
