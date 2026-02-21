import { useCallback } from "react";
import type { Tool } from "@modelcontextprotocol/sdk/types";
import { extractTextFromFile } from "../../chat/files/file";
import { extractTextFromZip } from "../../chat/files/fileConverters";

type ToolTextResult = {
  isError: boolean;
  content: { type: "text"; text: string }[];
};

const ok = (text: string): ToolTextResult => ({
  isError: false,
  content: [{ type: "text", text }],
});

const okMany = (texts: string[]): ToolTextResult => ({
  isError: false,
  content: texts.map(text => ({ type: "text", text })),
});

const fail = (err: unknown): ToolTextResult => ({
  isError: true,
  content: [
    {
      type: "text",
      text: err instanceof Error ? err.message : String(err),
    },
  ],
});

export const localWebFetchTool: Tool = {
  name: "local_web_fetch",
  title: "Fetch URL and read as text",
  description:
    "Fetch content from a URL through the browser and convert it to text using the default attachment conversion pipeline.",
  inputSchema: {
    type: "object",
    properties: {
      url: { type: "string", description: "The URL to fetch." },
      filename: {
        type: "string",
        description: "Optional filename override used for extension-based conversion.",
      },
      accept: {
        type: "string",
        description: "Optional HTTP Accept header value.",
      },
    },
    required: ["url"],
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
};

export const localWebPluginDef = {
  name: "local-web",
  match: (toolName: string) => toolName.startsWith("local_web_"),
  tools: [localWebFetchTool],
};

type LocalWebToolCall = {
  toolName: "local_web_fetch";
  input?: any;
};

function tryDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function filenameFromContentDisposition(headerValue?: string | null): string | undefined {
  if (!headerValue) return undefined;

  const star = headerValue.match(/filename\*=([^;]+)/i)?.[1]?.trim();
  if (star) {
    const cleaned = star.replace(/^UTF-8''/i, "").replace(/^"|"$/g, "");
    const decoded = tryDecodeURIComponent(cleaned);
    if (decoded) return decoded;
  }

  const plain = headerValue.match(/filename=([^;]+)/i)?.[1]?.trim();
  if (plain) {
    const cleaned = plain.replace(/^"|"$/g, "");
    if (cleaned) return cleaned;
  }

  return undefined;
}

function filenameFromUrl(urlString: string): string | undefined {
  try {
    const u = new URL(urlString);
    const segment = u.pathname.split("/").filter(Boolean).pop();
    if (!segment) return undefined;
    return tryDecodeURIComponent(segment);
  } catch {
    return undefined;
  }
}

function normalizeFilename(value: unknown): string | undefined {
  const v = String(value ?? "").trim();
  if (!v) return undefined;
  return v.replace(/[\\/:*?"<>|]+/g, "_");
}

export function useLocalWebreaderRuntime() {
  const handle = useCallback(
    async (toolCall: LocalWebToolCall, signal?: AbortSignal): Promise<ToolTextResult> => {
      try {
        if (toolCall.toolName !== "local_web_fetch") {
          throw new Error(`Unsupported tool: ${toolCall.toolName}`);
        }

        const { url, filename, accept } = toolCall.input ?? {};
        const normalizedUrl = String(url ?? "").trim();
        if (!normalizedUrl) throw new Error("Missing url.");

        const headers: Record<string, string> = {};
        if (typeof accept === "string" && accept.trim()) {
          headers.Accept = accept.trim();
        }

        const response = await fetch(normalizedUrl, {
          method: "GET",
          headers,
          signal,
        });

        if (!response.ok) {
          throw new Error(`Fetch failed: ${response.status} ${response.statusText}`.trim());
        }

        const blob = await response.blob();
        const fileName =
          normalizeFilename(filename) ||
          normalizeFilename(filenameFromContentDisposition(response.headers.get("content-disposition"))) ||
          normalizeFilename(filenameFromUrl(normalizedUrl)) ||
          `download-${Date.now()}`;

        const asFile = new File([blob], fileName, {
          type: blob.type || response.headers.get("content-type") || "application/octet-stream",
        });

        if (asFile.type === "application/zip" || /\.zip$/i.test(asFile.name)) {
          const parts = await extractTextFromZip(asFile);
          const texts = parts
            .filter(p => p?.type === "text" && typeof p.text === "string")
            .map(p => p.text);
          return okMany(texts.length ? texts : [await blob.text()]);
        }

        const converted = await extractTextFromFile(asFile);
        return ok(converted ?? (await blob.text()));
      } catch (e) {
        return fail(e);
      }
    },
    []
  );

  return {
    name: localWebPluginDef.name,
    handle,
  };
}

