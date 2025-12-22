import { 
  getAccessToken, 
  saveAccessToken, 
  clearAccessToken, 
  initiateOAuthFlow 
} from "./oauthClient";
import { IAuthStorage } from "../config/types";
import { localStorageAuth } from "../storage/defaultStorage";

/**
 * MCP OAuth helpers using default storage.
 * These are convenience wrappers for per-server token management and OAuth flow.
 */

const MCP_LAST_OAUTH_PREFIX = "mcp_last_oauth_";

/** Get the access token for a given MCP server URL. */
export function getMcpAccessToken(url: string, storage: IAuthStorage = localStorageAuth): string | null {
  return getAccessToken(url, storage);
}

/** Set the access token for a given MCP server URL. */
export function setMcpAccessToken(url: string, token: string, storage: IAuthStorage = localStorageAuth) {
  saveAccessToken(url, token, storage);
}

/** Clear the access token for a given MCP server URL. */
export function clearMcpAccessToken(url: string, storage: IAuthStorage = localStorageAuth) {
  clearAccessToken(url, storage);
}

/** Set the last OAuth timestamp for a given MCP server URL (in sessionStorage). */
export function setLastMcpOAuth(url: string) {
  try {
    sessionStorage.setItem(MCP_LAST_OAUTH_PREFIX + url, Date.now().toString());
  } catch {}
}

/** Get the last OAuth timestamp for a given MCP server URL. */
export function getLastMcpOAuth(url: string): number {
  try {
    return Number(sessionStorage.getItem(MCP_LAST_OAUTH_PREFIX + url) ?? 0);
  } catch {
    return 0;
  }
}

/** Clear the last OAuth timestamp for a given MCP server URL. */
export function clearLastMcpOAuth(url: string) {
  try {
    sessionStorage.removeItem(MCP_LAST_OAUTH_PREFIX + url);
  } catch {}
}

/**
 * Initiates the OAuth flow for a specific MCP server.
 * By default, navigates to the returned auth URL.
 * Pass {navigate: false} to just get the URL.
 */
export async function initiateMcpOAuthFlow(
  url: string, 
  opts?: { navigate?: boolean }, 
  storage: IAuthStorage = localStorageAuth
): Promise<string> {
  const authUrl = await initiateOAuthFlow(url, storage);
  if (opts?.navigate !== false) {
    window.location.assign(authUrl);
  }
  return authUrl;
}
