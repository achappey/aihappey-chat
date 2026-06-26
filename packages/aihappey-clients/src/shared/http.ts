const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const resolveUrl = (baseUrl: string, endpoint: string) => {
  const base = trimTrailingSlash(baseUrl || "");
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
};

export const createHeaders = async (
  headers?: Record<string, string>,
  getAccessToken?: () => Promise<string>,
) => {
  const merged = new Headers(headers ?? {});
  if (getAccessToken) {
    const token = await getAccessToken();
    if (token) merged.set("Authorization", `Bearer ${token}`);
  }
  if (!merged.has("Content-Type")) {
    merged.set("Content-Type", "application/json");
  }

  const contentType = merged.get("Content-Type") ?? merged.get("content-type");
  if (contentType) {
    const values = contentType
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (values.length > 1) {
      merged.set("Content-Type", values[0]);
    }
  }

  return merged;
};

export const headersToObject = (headers: Headers) => Object.fromEntries(Array.from(headers.entries()));

export const trimBaseUrl = trimTrailingSlash;

