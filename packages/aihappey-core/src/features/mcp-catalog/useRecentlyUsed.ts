export function useRecentlyUsed(): string[] {
  const names: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    if (key.startsWith("mcp_access_token_")) {
      // haal deel na het prefix
      names.push(key.replace("mcp_access_token_", ""));
    }
  }

  return names;
}
