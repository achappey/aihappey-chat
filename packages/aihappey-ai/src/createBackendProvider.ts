import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function createBackendProvider(name: string, baseURL: string,
  customHeaders?: Record<string, string>,
  getAccessToken?: () => Promise<string>) {
  return createOpenAICompatible({
    name: name,                  // shows up as provider name
    baseURL: baseURL,
    includeUsage: true,              // handy for streaming usage if supported
    fetch: async (input: any, init: any) => {
      const token = getAccessToken ? await getAccessToken() : null;
      const headers = new Headers(init?.headers);

      if (token)
        headers.set("Authorization", `Bearer ${token}`);
      // add your custom headers here too if needed

      if (customHeaders) {
        Object.entries(customHeaders).forEach(([k, v]) => {
          if (v != null) headers.set(k, v);
        });
      }

      return fetch(input, { ...init, headers });
    },
  });
}
