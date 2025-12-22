import { useMsal } from "@azure/msal-react";
import type { AccountInfo } from "@azure/msal-browser";

/**
 * Returns the first signed-in MSAL account or undefined when
 * no user is signed in / MsalProvider is missing.
 */
export const useAccount = (): AccountInfo | undefined => {
  try {
    const { accounts } = useMsal();
    return accounts?.[0];
  } catch {
    // useMsal throws if called outside a provider
    return undefined;
  }
};
