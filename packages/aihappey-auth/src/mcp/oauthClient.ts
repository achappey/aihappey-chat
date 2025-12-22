import { IAuthStorage } from "../config/types";

/**
 * Pure OAuth 2.1 PKCE client for MCP servers.
 * All storage is abstracted via IAuthStorage.
 */

const OAUTH_TARGET_URL_KEY = "mcp_oauth_target_url";
const OAUTH_FLOW_DETAILS_KEY = "mcp_oauth_flow_details";
const OAUTH_CODE_VERIFIER_KEY = "mcp_oauth_code_verifier";
const OAUTH_STATE_KEY = "mcp_oauth_state";
const ACCESS_TOKEN_STORAGE_PREFIX = "mcp_access_token_";

export type OAuthFlowDetails = {
  clientId: string;
  tokenEndpoint: string;
  redirectUri: string;
  authServerMetadataUrl: string;
  resource: string;
};

export type AuthServerMetadata = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  registration_endpoint?: string;
};

export type ProtectedResourceMetadata = {
  resource: string;
  scopes_supported: string[];
  authorization_servers: string[];
};

export type ClientRegistrationInfo = {
  client_id: string;
  client_secret?: string;
};

export const createPkceChallenge = async () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const code_verifier = btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const encoder = new TextEncoder();
  const data = encoder.encode(code_verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const code_challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return { code_verifier, code_challenge };
};

/**
 * Initiates the OAuth 2.1 Authorization Code Flow with PKCE and Dynamic Client Registration.
 * Returns the authorization URL to redirect the user.
 */
export const initiateOAuthFlow = async (
  mcpServerUrl: string,
  storage: IAuthStorage,
  clientName = "MCP Happey Web Client"
): Promise<string> => {
  storage.set(OAUTH_TARGET_URL_KEY, mcpServerUrl);

  // 1. Discover Protected Resource Metadata
  const parsedMcpUrl = new URL(mcpServerUrl);
  const mcpOrigin = parsedMcpUrl.origin;
  let mcpPath = parsedMcpUrl.pathname;
  if (mcpPath.startsWith("/")) mcpPath = mcpPath.substring(1);
  const fullPathForWellKnown = mcpPath && mcpPath !== "/" ? `/${mcpPath}` : "";
  const protectedResourceUrl = `${mcpOrigin}/.well-known/oauth-protected-resource${fullPathForWellKnown}`;
  //const protectedResourceUrl = `${mcpOrigin}/.well-known/oauth-protected-resource`;

  const prResponse = await fetch(protectedResourceUrl);
  if (!prResponse.ok) throw new Error("Failed to fetch protected resource metadata");
  const prMetadata = (await prResponse.json()) as ProtectedResourceMetadata;
  if (!prMetadata.authorization_servers?.length)
    throw new Error("No authorization_servers found in protected resource metadata.");
  const authServerMetadataUrl = prMetadata.authorization_servers[0];

  // 2. Get Auth Server Metadata
  const asResponse = await fetch(authServerMetadataUrl);
  if (!asResponse.ok) throw new Error("Failed to fetch authorization server metadata");
  const asMetadata = (await asResponse.json()) as AuthServerMetadata;
  if (!asMetadata.authorization_endpoint || !asMetadata.token_endpoint || !asMetadata.registration_endpoint)
    throw new Error("Incomplete authorization server metadata (missing endpoint(s)).");

  // 3. Define Redirect URI
  const redirectUri = `${window.location.origin}/oauth-callback`;

  // 4. Dynamic Client Registration
  const clientRegPayload = {
    client_name: clientName,
    redirect_uris: [redirectUri],
    grant_types: ["authorization_code"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
    scope: prMetadata.scopes_supported?.join(" "),
  };

  const regResponse = await fetch(asMetadata.registration_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(clientRegPayload),
  });
  if (!regResponse.ok) throw new Error("Dynamic client registration failed");
  const clientInfo = (await regResponse.json()) as ClientRegistrationInfo;
  const clientId = clientInfo.client_id;

  const flowDetails: OAuthFlowDetails = {
    clientId,
    tokenEndpoint: asMetadata.token_endpoint,
    redirectUri,
    resource: prMetadata.resource,
    authServerMetadataUrl,
  };
  storage.set(OAUTH_FLOW_DETAILS_KEY, JSON.stringify(flowDetails));

  // 5. PKCE Setup
  const { code_verifier, code_challenge } = await createPkceChallenge();
  const state = crypto.randomUUID();

  storage.set(OAUTH_CODE_VERIFIER_KEY, code_verifier);
  storage.set(OAUTH_STATE_KEY, state);

  // 6. Construct Authorization URL
  const authUrl = new URL(asMetadata.authorization_endpoint);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("code_challenge", code_challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("state", state);
  //if (prMetadata.resource) {
//    authUrl.searchParams.set("resource", prMetadata.resource);
//  }

  if (clientRegPayload.scope) authUrl.searchParams.set("scope", clientRegPayload.scope);

  return authUrl.toString();
};

/**
 * Handles the OAuth callback by exchanging the authorization code for an access token.
 * Returns { accessToken, targetUrl } or { error, errorDescription }
 */
export const handleOAuthCallback = async (
  storage: IAuthStorage
): Promise<{ accessToken: string; targetUrl?: string } | { error: string; errorDescription?: string }> => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const receivedState = params.get("state");
  const error = params.get("error");
  const errorDescription = params.get("error_description");

  const storedState = storage.get(OAUTH_STATE_KEY);
  const codeVerifier = storage.get(OAUTH_CODE_VERIFIER_KEY);
  const flowDetailsRaw = storage.get(OAUTH_FLOW_DETAILS_KEY);
  const targetUrl = storage.get(OAUTH_TARGET_URL_KEY) || undefined;

  // Clear temporary storage items
  storage.del(OAUTH_STATE_KEY);
  storage.del(OAUTH_CODE_VERIFIER_KEY);
  storage.del(OAUTH_FLOW_DETAILS_KEY);

  if (error) return { error, errorDescription: errorDescription || "Unknown OAuth error occurred." };
  if (!code) return { error: "missing_code", errorDescription: "Authorization code is missing from callback." };
  if (!storedState) return { error: "missing_stored_state", errorDescription: "Stored OAuth state is missing." };
  if (receivedState !== storedState)
    return { error: "state_mismatch", errorDescription: "OAuth state mismatch. Possible CSRF attack." };
  if (!codeVerifier) return { error: "missing_verifier", errorDescription: "PKCE code verifier is missing." };
  if (!flowDetailsRaw) return { error: "missing_flow_details", errorDescription: "OAuth flow details missing." };

  try {
    const flowDetails = JSON.parse(flowDetailsRaw) as OAuthFlowDetails;
    const tokenPayload = new URLSearchParams();
    tokenPayload.set("grant_type", "authorization_code");
    tokenPayload.set("client_id", flowDetails.clientId);
    tokenPayload.set("code", code);
    tokenPayload.set("redirect_uri", flowDetails.redirectUri);
    tokenPayload.set("code_verifier", codeVerifier);

    // Only set resource if it exists
    if (flowDetails.resource) {
      tokenPayload.set("resource", flowDetails.resource);
    }

    const tokenResponse = await fetch(flowDetails.tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenPayload.toString(),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.json().catch(() => ({
        error: "token_exchange_failed",
        error_description: "Failed to parse error from token endpoint.",
      }));
      
      return {
        error: errorBody.error || "token_exchange_failed",
        errorDescription: errorBody.error_description || `Token exchange failed with status ${tokenResponse.status}`,
      };
    }

    const tokens = await tokenResponse.json();
    if (!tokens.access_token) {
      return { error: "missing_access_token", errorDescription: "Access token not found in token response." };
    }

    return { accessToken: tokens.access_token, targetUrl };
  } catch (err) {
    return {
      error: "callback_processing_error",
      errorDescription: err instanceof Error ? err.message : "Unexpected error during callback processing.",
    };
  }
};


/**
 * Handles the OAuth callback by exchanging the authorization code for an access token.
 * Returns { accessToken, targetUrl } or { error, errorDescription }
 */
export const handleOAuthCallbac2k = async (
  storage: IAuthStorage
): Promise<{ accessToken: string; targetUrl?: string } | { error: string; errorDescription?: string }> => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const receivedState = params.get("state");
  const error = params.get("error");
  const errorDescription = params.get("error_description");

  const storedState = storage.get(OAUTH_STATE_KEY);
  const codeVerifier = storage.get(OAUTH_CODE_VERIFIER_KEY);
  const flowDetailsRaw = storage.get(OAUTH_FLOW_DETAILS_KEY);
  const targetUrl = storage.get(OAUTH_TARGET_URL_KEY) || undefined;

  // Clear temporary storage items
  storage.del(OAUTH_STATE_KEY);
  storage.del(OAUTH_CODE_VERIFIER_KEY);
  storage.del(OAUTH_FLOW_DETAILS_KEY);

  if (error) return { error, errorDescription: errorDescription || "Unknown OAuth error occurred." };
  if (!code) return { error: "missing_code", errorDescription: "Authorization code is missing from callback." };
  if (!storedState) return { error: "missing_stored_state", errorDescription: "Stored OAuth state is missing." };
  if (receivedState !== storedState)
    return { error: "state_mismatch", errorDescription: "OAuth state mismatch. Possible CSRF attack." };
  if (!codeVerifier) return { error: "missing_verifier", errorDescription: "PKCE code verifier is missing." };
  if (!flowDetailsRaw) return { error: "missing_flow_details", errorDescription: "OAuth flow details missing." };

  try {
    const flowDetails = JSON.parse(flowDetailsRaw) as OAuthFlowDetails;
    const tokenPayload = new URLSearchParams();
    tokenPayload.set("grant_type", "authorization_code");
    tokenPayload.set("client_id", flowDetails.clientId);
    tokenPayload.set("code", code);
    tokenPayload.set("redirect_uri", flowDetails.redirectUri);
    tokenPayload.set("code_verifier", codeVerifier);

    const tokenResponse = await fetch(flowDetails.tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenPayload.toString(),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.json().catch(() => ({
        error: "token_exchange_failed",
        error_description: "Failed to parse error from token endpoint.",
      }));
      return {
        error: errorBody.error || "token_exchange_failed",
        errorDescription: errorBody.error_description || `Token exchange failed with status ${tokenResponse.status}`,
      };
    }

    const tokens = await tokenResponse.json();
    if (!tokens.access_token) {
      return { error: "missing_access_token", errorDescription: "Access token not found in token response." };
    }

    return { accessToken: tokens.access_token, targetUrl };
  } catch (err) {
    return {
      error: "callback_processing_error",
      errorDescription: err instanceof Error ? err.message : "Unexpected error during callback processing.",
    };
  }
};

/**
 * Saves the access token for a given server URL to storage.
 */
export const saveAccessToken = (serverUrl: string, token: string, storage: IAuthStorage) => {
  storage.set(`${ACCESS_TOKEN_STORAGE_PREFIX}${serverUrl}`, token);
};

/**
 * Retrieves the access token for a given server URL from storage.
 */
export const getAccessToken = (serverUrl: string, storage: IAuthStorage): string | null => {
  return storage.get(`${ACCESS_TOKEN_STORAGE_PREFIX}${serverUrl}`);
};

/**
 * Clears the access token for a given server URL from storage.
 */
export const clearAccessToken = (serverUrl: string, storage: IAuthStorage) => {
  storage.del(`${ACCESS_TOKEN_STORAGE_PREFIX}${serverUrl}`);
};
