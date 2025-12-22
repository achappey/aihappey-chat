import { useMsal } from "@azure/msal-react";
import { useState, useCallback } from "react";

/**
 * Hook to acquire an access token for given scopes.
 * Returns [token, loading, error, refreshFn]
 */
export const useAccessToken = (scopes: string[]) => {
  const { instance, accounts } = useMsal();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!accounts.length) throw new Error("No account signed in");
      const resp = await instance.acquireTokenSilent({
        scopes,
        account: accounts[0],
      });
      setToken(resp.accessToken);
      return resp.accessToken;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, [instance, accounts, scopes]);

  return [token, loading, error, refresh] as const;
};
