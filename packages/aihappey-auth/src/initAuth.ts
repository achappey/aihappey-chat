import { AuthConfig, IAuthStorage } from "./config/types";
import { localStorageAuth } from "./storage/defaultStorage";
import { createMsalInstance } from "./msal/provider";

let _authConfig: AuthConfig | null = null;
let _msalInstance: ReturnType<typeof createMsalInstance> | null = null;
let _storage: IAuthStorage = localStorageAuth;

/**
 * Call once at app startup to configure aihappey-auth.
 * Returns the MSAL instance for use in MsalAuthProvider.
 */
export function initAuth(config: AuthConfig) {
  _authConfig = config;
  _storage = config.storage || localStorageAuth;
  _msalInstance = createMsalInstance(config.msal);
  //_msalInstance.handleRedirectPromise().catch(() => {});
  return _msalInstance;
}

/**
 * Returns the current AuthConfig (read-only).
 */
export function getAuthConfig(): AuthConfig | null {
  return _authConfig;
}

/**
 * Returns the current IAuthStorage in use.
 */
export function getAuthStorage(): IAuthStorage {
  return _storage;
}

/**
 * Returns the current MSAL instance (if initialized).
 */
export function getMsalInstance() {
  return _msalInstance;
}
