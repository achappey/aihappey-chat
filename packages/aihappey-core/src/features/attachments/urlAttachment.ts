import type { FileUIPart } from "aihappey-ai";
import mime from "mime";

export type UrlAttachment = { type: "url"; url: string };

export const createUrlAttachment = (value: string): UrlAttachment => {
  const url = value.trim();
  if (!isHttpUrl(url)) throw new Error("Invalid URL");
  return { type: "url", url };
};

export const isHttpUrl = (value: string): boolean => {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

export const validMediaType = (value: string): string | undefined => {
  const type = value.split(";")[0].trim().toLowerCase();
  return /^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/.test(type)
    && type !== "application/octet-stream" ? type : undefined;
};

export const urlFilename = (value: string): string | undefined => {
  try {
    const url = new URL(value);
    const name = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() ?? "");
    return name || url.hostname || undefined;
  } catch {
    return undefined;
  }
};

/** A CORS-restricted or failed lookup never prevents attaching a URL. */
export const resolveUrlMediaType = async (value: string): Promise<string | undefined> => {
  if (!isHttpUrl(value)) return undefined;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(value, { method: "HEAD", signal: controller.signal });
    if (response.ok) {
      const type = validMediaType(response.headers.get("content-type") ?? "");
      if (type) return type;
    }
  } catch {
    // CORS, network and HEAD restrictions are expected; use the path or ask the user.
  } finally {
    clearTimeout(timeout);
  }
  const pathname = new URL(value).pathname;
  return validMediaType(mime.getType(pathname) ?? "");
};

export const createUrlFilePart = (value: string, mediaType: string): FileUIPart => {
  const url = value.trim();
  const type = validMediaType(mediaType);
  if (!isHttpUrl(url) || !type) throw new Error("Invalid URL or media type");
  return { type: "file", url, mediaType: type, filename: urlFilename(url) };
};
