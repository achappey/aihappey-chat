/**
 * AuthConfig and related types for aihappey-auth.
 * All configuration is provided at runtime via initAuth().
 */

export type MsalConfig = {
  clientId: string;
  authority: string;
  redirectUri: string;
  scopes: string[];
};

export type McpConfig = {
  enabled: boolean;
  clientName?: string;
};

export type AuthConfig = {
  msal: MsalConfig;
  mcp?: McpConfig;
  storage?: IAuthStorage;
};

export interface IAuthStorage {
  get(key: string): string | null;
  set(key: string, value: string): void;
  del(key: string): void;
}
