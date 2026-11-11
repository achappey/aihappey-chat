import type { Provider } from "aihappey-types";
import {
  createChatAuthHeadersForModel,
  createMessagesEndpointHeadersForProviderKey,
  createProviderBearerHeadersForProviderKey,
  mergeCredentialHeaders,
} from "../../provider-credentials/providerAuthHeaders";

/** Gateway endpoint credentials and direct provider credentials are separate trust domains. */
export function createChatRouteHeaders({
  configuredHeaders, customHeaders, modelId, directProviderKey, endpoint,
  authenticated, providers, providerHeaders, providerRequestHeaders,
}: {
  configuredHeaders?: Record<string, string>;
  customHeaders?: Record<string, string>;
  modelId?: string;
  directProviderKey?: string;
  endpoint: string;
  authenticated: boolean;
  providers?: Record<string, Provider>;
  providerHeaders?: Record<string, string>;
  providerRequestHeaders?: Record<string, string>;
}) {
  const credentials = mergeCredentialHeaders(configuredHeaders, customHeaders);
  if (!directProviderKey) {
    return authenticated
      ? createChatAuthHeadersForModel(configuredHeaders, undefined, false, providers)
      : createChatAuthHeadersForModel(credentials, modelId, false, providers);
  }
  if (authenticated) throw new Error("Direct provider access is unavailable with gateway authentication.");

  // Only this provider's request settings may supply non-authentication headers.
  // Global endpoint headers (including gateway Authorization) never cross to a provider.
  const headers = new Headers(mergeCredentialHeaders(providerHeaders, providerRequestHeaders));
  for (const name of [...headers.keys()]) {
    if (/^(authorization|proxy-authorization|api-key|x-api-key|x-goog-api-key|x-.+-key|cookie)$/i.test(name)) headers.delete(name);
  }
  const nativeAuth = endpoint === "/v1/messages"
    ? createMessagesEndpointHeadersForProviderKey(credentials, directProviderKey, providers)
    : createProviderBearerHeadersForProviderKey(credentials, directProviderKey, providers);
  new Headers(nativeAuth).forEach((value, name) => {
    // The native helper supplies a compatibility fallback, not an authentication policy.
    if (name === "anthropic-version" && headers.has(name)) return;
    headers.set(name, value);
  });
  return Object.fromEntries(headers.entries());
}
