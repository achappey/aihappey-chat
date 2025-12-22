import { getMsalInstance, getAuthConfig } from "../initAuth";

/**
 * Acquire an access token for the given scopes.
 * Falls back to popup if silent fails.
 */
export async function acquireAccessToken(scopes?: string[]) {
  const msal = getMsalInstance();
  if (!msal) throw new Error("MSAL not initialised – did you call initAuth()?");
  const accounts = msal.getAllAccounts();
  if (!accounts.length) throw new Error("No signed-in account");

  const req = { scopes: scopes ?? getAuthConfig()?.msal.scopes ?? [], account: accounts[0] };

  try {
    const res = await msal.acquireTokenSilent(req);
    return res.accessToken;
  } catch {
    const res = await msal.acquireTokenPopup(req);
    return res.accessToken;
  }
}
