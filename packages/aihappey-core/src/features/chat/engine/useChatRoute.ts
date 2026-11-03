import { useEffect, useMemo } from "react";
import { useAppStore } from "aihappey-state";
import { useProviderRegistry } from "../../../runtime/providers/useProviderRegistry";
import { mergeCredentialHeaders } from "../../provider-credentials/providerAuthHeaders";
import { resolveChatRoute } from "./endpointProfiles";

type ChatRouteConfig = {
  baseUrl?: string;
  gatewayEnabled?: boolean;
  headers?: Record<string, string>;
  getAccessToken?: () => Promise<string>;
};

export function useChatRoute(config: ChatRouteConfig, synchronize = false) {
  const modelId = useAppStore(s => s.selectedModel);
  const models = useAppStore(s => s.models);
  const mode = useAppStore(s => s.effectiveChatEndpointMode);
  const endpoint = useAppStore(s => s.effectiveChatEndpoint);
  const customHeaders = useAppStore(s => s.customHeaders);
  const gatewayEnabled = useAppStore(s => s.gatewayEnabled);
  const setMode = useAppStore(s => s.setSelectedChatEndpointMode);
  const setEndpoint = useAppStore(s => s.setSelectedChatEndpoint);
  const providers = useProviderRegistry();
  const authenticated = !!config.getAccessToken;
  const gatewayAvailable = !!config.baseUrl?.trim()
    && (authenticated || (config.gatewayEnabled !== false && gatewayEnabled !== false));
  const route = useMemo(() => resolveChatRoute({
    modelId, model: models?.find(model => model.id === modelId), mode,
    selectedChatEndpoint: endpoint, providers,
    customHeaders: mergeCredentialHeaders(config.headers, customHeaders),
    gatewayEnabled: gatewayAvailable, authenticated,
  }), [modelId, models, mode, endpoint, providers, config.headers, customHeaders, gatewayAvailable, authenticated]);

  useEffect(() => {
    if (!synchronize) return;
    if (route.mode !== mode) setMode(route.mode);
    if (route.endpoint !== endpoint) setEndpoint(route.endpoint);
  }, [synchronize, route.mode, route.endpoint, mode, endpoint, setMode, setEndpoint]);

  return { ...route, gatewayAvailable };
}
