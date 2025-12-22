export { default as OAuthCallbackPage } from "./OAuthCallbackPage";
export * from "./initAuth";
export { createMsalInstance, MsalAuthProvider } from "./msal/provider";
export { useAccount } from "./msal/useAccount";
export { acquireAccessToken } from "./msal/acquireToken";
export {
  getMcpAccessToken,
  initiateMcpOAuthFlow,
  clearMcpAccessToken,
} from "./mcp/helpers";
export type { AuthConfig } from "./config/types";
export { MsalAuthenticationTemplate } from "@azure/msal-react";
export { InteractionType, PublicClientApplication } from "@azure/msal-browser";
export { useAccessToken } from "./msal/useAccessToken";