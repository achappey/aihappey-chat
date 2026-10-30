import { createBackendProvider as createProvider } from "aihappey-ai";
import { createCredentialScopedFetch } from "./scopedRequest";

// SDK tools select their model after constructing the provider. Scope at send time.
export const createBackendProvider = (
  name: string,
  baseURL: string,
  customHeaders?: Record<string, string>,
  getAccessToken?: () => Promise<string>,
  customFetch?: typeof fetch,
) => createProvider(name, baseURL, customHeaders, getAccessToken, createCredentialScopedFetch(customFetch));
