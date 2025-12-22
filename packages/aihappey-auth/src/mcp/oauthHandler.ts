// src/auth/oauthHandler.ts

import { createPkceChallenge } from "./pkce";


const OAUTH_TARGET_URL_KEY = 'mcp_oauth_target_url';
const OAUTH_FLOW_DETAILS_KEY = 'mcp_oauth_flow_details';
const OAUTH_CODE_VERIFIER_KEY = 'mcp_oauth_code_verifier';
const OAUTH_STATE_KEY = 'mcp_oauth_state';
const ACCESS_TOKEN_STORAGE_PREFIX = 'mcp_access_token_';

type AuthServerMetadata = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  registration_endpoint?: string;
  // Add other properties as needed from RFC 8414
};

type ProtectedResourceMetadata = {
  resource: string;
  scopes_supported: string[];
  authorization_servers: string[];
  // Add other properties as needed
};

type ClientRegistrationInfo = {
  client_id: string;
  client_secret?: string;
  // Add other properties as needed from RFC 7591
};

type OAuthFlowDetails = {
  clientId: string;
  tokenEndpoint: string;
  redirectUri: string;
  authServerMetadataUrl: string;
};

/**
 * Initiates the OAuth 2.1 Authorization Code Flow with PKCE and Dynamic Client Registration.
 * @param mcpServerUrl The URL of the MCP server requiring authentication.
 */
export const initiateOAuthFlow = async (mcpServerUrl: string): Promise<void> => {
  try {
    localStorage.setItem(OAUTH_TARGET_URL_KEY, mcpServerUrl);

    // 1. Discover Protected Resource Metadata
    const parsedMcpUrl = new URL(mcpServerUrl);
    const mcpOrigin = parsedMcpUrl.origin;
    let mcpPath = parsedMcpUrl.pathname;
    if (mcpPath.startsWith('/')) {
      mcpPath = mcpPath.substring(1);
    }
    // Ensure path is not empty or just a slash, adjust if necessary
    const fullPathForWellKnown = mcpPath && mcpPath !== '/' ? `/${mcpPath}` : '';
    const protectedResourceUrl = `${mcpOrigin}/.well-known/oauth-protected-resource${fullPathForWellKnown}`;
    
    console.log(`Fetching protected resource metadata from: ${protectedResourceUrl}`);
    const prResponse = await fetch(protectedResourceUrl);
    if (!prResponse.ok) {
      throw new Error(`Failed to fetch protected resource metadata (${prResponse.status}) from ${protectedResourceUrl}`);
    }
    const prMetadata = (await prResponse.json()) as ProtectedResourceMetadata;
    if (!prMetadata.authorization_servers || prMetadata.authorization_servers.length === 0) {
      throw new Error('No authorization_servers found in protected resource metadata.');
    }
    const authServerMetadataUrl = prMetadata.authorization_servers[0];

    // 2. Get Auth Server Metadata
    console.log(`Fetching auth server metadata from: ${authServerMetadataUrl}`);
    const asResponse = await fetch(authServerMetadataUrl);
    if (!asResponse.ok) {
      throw new Error(`Failed to fetch authorization server metadata (${asResponse.status}) from ${authServerMetadataUrl}`);
    }
    const asMetadata = (await asResponse.json()) as AuthServerMetadata;
    if (!asMetadata.authorization_endpoint || !asMetadata.token_endpoint || !asMetadata.registration_endpoint) {
      throw new Error('Incomplete authorization server metadata (missing endpoint(s)).');
    }

    // 3. Define Redirect URI
    const redirectUri = `${window.location.origin}/oauth-callback`; // Ensure this route exists

    // 4. Dynamic Client Registration
    const clientRegPayload = {
      client_name: 'MCP Happey Web Client',
      redirect_uris: [redirectUri],
      grant_types: ['authorization_code'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none', // For public clients using PKCE
      scope: prMetadata.scopes_supported ? prMetadata.scopes_supported.join(' ') : undefined,
    };
    console.log('Registering dynamic client with payload:', clientRegPayload);
    const regResponse = await fetch(asMetadata.registration_endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientRegPayload),
    });
    if (!regResponse.ok) {
      const errorBody = await regResponse.text();
      throw new Error(`Dynamic client registration failed (${regResponse.status}): ${errorBody}`);
    }
    const clientInfo = (await regResponse.json()) as ClientRegistrationInfo;
    const clientId = clientInfo.client_id;

    const flowDetails: OAuthFlowDetails = {
      clientId,
      tokenEndpoint: asMetadata.token_endpoint,
      redirectUri,
      authServerMetadataUrl,
    };
    localStorage.setItem(OAUTH_FLOW_DETAILS_KEY, JSON.stringify(flowDetails));

    // 5. PKCE Setup
    const { code_verifier, code_challenge } = await createPkceChallenge();
    const state = crypto.randomUUID(); // Simple random state

    localStorage.setItem(OAUTH_CODE_VERIFIER_KEY, code_verifier);
    localStorage.setItem(OAUTH_STATE_KEY, state);

    // 6. Construct Authorization URL
    const authUrl = new URL(asMetadata.authorization_endpoint);
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('code_challenge', code_challenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    authUrl.searchParams.set('state', state);
    if (clientRegPayload.scope) {
      authUrl.searchParams.set('scope', clientRegPayload.scope);
    }

    console.log(`Redirecting to authorization server: ${authUrl.toString()}`);
    // 7. Redirect (no popup)
    window.location.assign(authUrl.toString());
  } catch (error) {
    console.error('OAuth initiation failed:', error);
    // Potentially update UI to show error to user
    // For now, re-throw or handle as appropriate for the calling context
    throw error; 
  }
};

/**
 * Handles the OAuth callback by exchanging the authorization code for an access token.
 * @returns A Promise resolving to an object with the access token and target URL, or an error.
 */
export const handleOAuthCallback = async (): Promise<{ accessToken: string; targetUrl?: string } | { error: string; errorDescription?: string }> => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const receivedState = params.get('state');
  const error = params.get('error');
  const errorDescription = params.get('error_description');

  const storedState = localStorage.getItem(OAUTH_STATE_KEY);
  const codeVerifier = localStorage.getItem(OAUTH_CODE_VERIFIER_KEY);
  const flowDetailsRaw = localStorage.getItem(OAUTH_FLOW_DETAILS_KEY);
  const targetUrl = localStorage.getItem(OAUTH_TARGET_URL_KEY) || undefined;

  // Clear temporary localStorage items
  localStorage.removeItem(OAUTH_STATE_KEY);
  localStorage.removeItem(OAUTH_CODE_VERIFIER_KEY);
  localStorage.removeItem(OAUTH_FLOW_DETAILS_KEY);
  // OAUTH_TARGET_URL_KEY is kept for now, to be used by the callback page

  if (error) {
    return { error, errorDescription: errorDescription || 'Unknown OAuth error occurred.' };
  }
  if (!code) {
    return { error: 'missing_code', errorDescription: 'Authorization code is missing from callback.' };
  }
  if (!storedState) {
    return { error: 'missing_stored_state', errorDescription: 'Stored OAuth state is missing. Cannot verify callback.' };
  }
  if (receivedState !== storedState) {
    return { error: 'state_mismatch', errorDescription: 'OAuth state mismatch. Possible CSRF attack.' };
  }
  if (!codeVerifier) {
    return { error: 'missing_verifier', errorDescription: 'PKCE code verifier is missing from storage.' };
  }
  if (!flowDetailsRaw) {
    return { error: 'missing_flow_details', errorDescription: 'OAuth flow details are missing from storage.' };
  }

  try {
    const flowDetails = JSON.parse(flowDetailsRaw) as OAuthFlowDetails;

    const tokenPayload = new URLSearchParams();
    tokenPayload.set('grant_type', 'authorization_code');
    tokenPayload.set('client_id', flowDetails.clientId);
    tokenPayload.set('code', code);
    tokenPayload.set('redirect_uri', flowDetails.redirectUri);
    tokenPayload.set('code_verifier', codeVerifier);

    const tokenResponse = await fetch(flowDetails.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenPayload.toString(),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.json().catch(() => ({ error: 'token_exchange_failed', error_description: 'Failed to parse error from token endpoint.' }));
      return { 
        error: errorBody.error || 'token_exchange_failed', 
        errorDescription: errorBody.error_description || `Token exchange failed with status ${tokenResponse.status}`
      };
    }

    const tokens = await tokenResponse.json();
    if (!tokens.access_token) {
      return { error: 'missing_access_token', errorDescription: 'Access token not found in token response.' };
    }

    return { accessToken: tokens.access_token, targetUrl };
  } catch (err) {
    return { 
      error: 'callback_processing_error', 
      errorDescription: err instanceof Error ? err.message : 'An unexpected error occurred during callback processing.' 
    };
  }
};

/**
 * Saves the access token for a given server URL to localStorage.
 * @param serverUrl The URL of the MCP server.
 * @param token The access token.
 */
export const saveAccessToken = (serverUrl: string, token: string): void => {
  try {
    localStorage.setItem(`${ACCESS_TOKEN_STORAGE_PREFIX}${serverUrl}`, token);
  } catch (e) {
    console.error("Failed to save access token to localStorage:", e);
  }
};

/**
 * Retrieves the access token for a given server URL from localStorage.
 * @param serverUrl The URL of the MCP server.
 * @returns The access token string, or null if not found or if localStorage is unavailable.
 */
export const getAccessToken = (serverUrl: string): string | null => {
  try {
    return localStorage.getItem(`${ACCESS_TOKEN_STORAGE_PREFIX}${serverUrl}`);
  } catch (e) {
    console.error("Failed to get access token from localStorage:", e);
    return null;
  }
};

/**
 * Clears the access token for a given server URL from localStorage.
 * @param serverUrl The URL of the MCP server.
 */
export const clearAccessToken = (serverUrl: string): void => {
  try {
    localStorage.removeItem(`${ACCESS_TOKEN_STORAGE_PREFIX}${serverUrl}`);
  } catch (e) {
    console.error("Failed to clear access token from localStorage:", e);
  }
};
