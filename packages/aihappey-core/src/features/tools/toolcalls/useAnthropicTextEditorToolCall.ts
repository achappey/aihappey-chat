import { useCallback } from "react";
import type { FilesContextType } from "aihappey-files";
import { ToolPlugin } from "./usePlugins";

type ToolTextResult = {
  isError: boolean;
  content: { type: "text"; text: string }[];
};

type AnthropicTextEditorCommand = "view" | "create" | "str_replace" | "insert";

type AnthropicTextEditorToolCall = {
  toolName: "str_replace_based_edit_tool" | "str_replace_editor";
  input: Record<string, any> & { command: AnthropicTextEditorCommand };
};

const TEXT_EDITOR_TOOL_NAMES = ["str_replace_based_edit_tool", "str_replace_editor"] as const;

const TEXT_FILE_EXTENSIONS = new Set([
  "bat",
  "c",
  "cc",
  "cmd",
  "conf",
  "cpp",
  "cs",
  "css",
  "csv",
  "cxx",
  "go",
  "h",
  "hpp",
  "htm",
  "html",
  "ini",
  "java",
  "js",
  "json",
  "jsx",
  "less",
  "log",
  "md",
  "mdx",
  "mjs",
  "php",
  "py",
  "rb",
  "rs",
  "scss",
  "sh",
  "sql",
  "text",
  "toml",
  "ts",
  "tsx",
  "tsv",
  "txt",
  "xml",
  "yaml",
  "yml",
]);

const MIME_TYPE_BY_EXTENSION: Record<string, string> = {
  bat: "text/plain",
  c: "text/plain",
  cc: "text/plain",
  cmd: "text/plain",
  conf: "text/plain",
  cpp: "text/plain",
  cs: "text/plain",
  css: "text/css",
  csv: "text/csv",
  cxx: "text/plain",
  go: "text/plain",
  h: "text/plain",
  hpp: "text/plain",
  htm: "text/html",
  html: "text/html",
  ini: "text/plain",
  java: "text/plain",
  js: "text/javascript",
  json: "application/json",
  jsx: "text/plain",
  less: "text/css",
  log: "text/plain",
  md: "text/markdown",
  mdx: "text/markdown",
  mjs: "text/javascript",
  php: "text/plain",
  py: "text/x-python",
  rb: "text/plain",
  rs: "text/plain",
  scss: "text/x-scss",
  sh: "text/x-shellscript",
  sql: "text/plain",
  text: "text/plain",
  toml: "text/plain",
  ts: "text/plain",
  tsx: "text/plain",
  tsv: "text/tab-separated-values",
  txt: "text/plain",
  xml: "application/xml",
  yaml: "text/yaml",
  yml: "text/yaml",
};

const TEXT_MIME_TYPES = new Set([
  "application/json",
  "application/ld+json",
  "application/xml",
  "text/css",
  "text/csv",
  "text/html",
  "text/javascript",
  "text/markdown",
  "text/plain",
  "text/tab-separated-values",
  "text/x-python",
  "text/x-scss",
  "text/x-shellscript",
  "text/xml",
  "text/yaml",
]);

const ok = (text: string): ToolTextResult => ({
  isError: false,
  content: [{ type: "text", text }],
});

const fail = (err: unknown): ToolTextResult => ({
  isError: true,
  content: [{ type: "text", text: err instanceof Error ? err.message : String(err) }],
});

const hasTextEditorType = (value: unknown) =>
  typeof value === "string" && /^text_editor(?:_\d{8})?$/.test(value);

const getFileExtension = (name: string) => {
  const lastDot = name.lastIndexOf(".");
  return lastDot >= 0 ? name.slice(lastDot + 1).toLowerCase() : "";
};

const isFlatWorkspaceName = (name: string) => !/[\\/]/.test(name);

const isAllowedTextFile = (name: string, mimeType?: string | null) => {
  const extension = getFileExtension(name);
  if (TEXT_FILE_EXTENSIONS.has(extension)) return true;

  const normalizedMimeType = String(mimeType ?? "").trim().toLowerCase();
  return normalizedMimeType.startsWith("text/") || TEXT_MIME_TYPES.has(normalizedMimeType);
};

const inferMimeType = (name: string) => MIME_TYPE_BY_EXTENSION[getFileExtension(name)] ?? "text/plain";

const normalizePath = (value: unknown) => {
  const rawPath = String(value ?? "").trim();
  if (!rawPath || rawPath === "/") return null;

  const normalized = rawPath
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/^\/+/, "")
    .trim();

  if (!normalized) return null;
  if (normalized === "." || normalized === ".." || normalized.includes("../")) {
    throw new Error("Invalid path. Relative traversal is not allowed.");
  }

  if (!isFlatWorkspaceName(normalized)) {
    throw new Error(
      "Directory paths are not supported in this flat workspace. Use `/` to list files or specify an exact file name."
    );
  }

  return normalized;
};

const splitFileLines = (content: string) => (content.length ? content.split("\n") : []);

const formatLineNumberedText = (content: string, viewRange?: unknown) => {
  const lines = splitFileLines(content);

  if (!viewRange) {
    return lines.map((line, index) => `${index + 1}: ${line}`).join("\n");
  }

  if (
    !Array.isArray(viewRange)
    || viewRange.length !== 2
    || !Number.isInteger(viewRange[0])
    || !Number.isInteger(viewRange[1])
  ) {
    throw new Error("Invalid view_range. Expected [startLine, endLine].");
  }

  const [startLine, endLine] = viewRange as [number, number];
  if (startLine < 1) throw new Error("Invalid view_range. Start line must be >= 1.");
  if (endLine !== -1 && endLine < startLine) {
    throw new Error("Invalid view_range. End line must be -1 or >= start line.");
  }

  const sliced = lines.slice(startLine - 1, endLine === -1 ? undefined : endLine);
  return sliced.map((line, index) => `${startLine + index}: ${line}`).join("\n");
};

const truncateText = (value: string, maxCharacters?: number) => {
  if (!Number.isFinite(maxCharacters) || !maxCharacters || maxCharacters < 1) return value;
  if (value.length <= maxCharacters) return value;
  if (maxCharacters <= 3) return value.slice(0, maxCharacters);
  return `${value.slice(0, maxCharacters - 3)}...`;
};

const countOccurrences = (content: string, search: string) => {
  let count = 0;
  let startIndex = 0;

  while (true) {
    const matchIndex = content.indexOf(search, startIndex);
    if (matchIndex === -1) return count;
    count += 1;
    startIndex = matchIndex + search.length;
  }
};

const listAllowedTextFiles = (files: FilesContextType) => {
  const names = files.items
    .filter((file) => isFlatWorkspaceName(file.name))
    .filter((file) => isAllowedTextFile(file.name, file.data?.type))
    .map((file) => file.name)
    .sort((left, right) => left.localeCompare(right));

  return names.length
    ? [`Flat workspace text files:`, ...names.map((name) => `- ${name}`)].join("\n")
    : "No text files available.";
};

const resolveFileByName = async (files: FilesContextType, path: string) => {
  const matches = files.items.filter((file) => file.name === path);
  if (matches.length === 0) throw new Error("Error: File not found");
  if (matches.length > 1) {
    throw new Error("Error: Multiple files found with the same name. Please rename duplicates.");
  }

  const match = matches[0];
  if (!isAllowedTextFile(match.name, match.data?.type)) {
    throw new Error("Error: Only text files are supported by the Anthropic text editor tool.");
  }

  const stored = await files.read(match.id);
  if (!stored) throw new Error("Error: File not found");
  if (!isAllowedTextFile(stored.name, stored.data?.type)) {
    throw new Error("Error: Only text files are supported by the Anthropic text editor tool.");
  }

  return stored;
};

export const getAnthropicTextEditorConfig = (anthropicConfig: any) => {
  if (!anthropicConfig) return undefined;
  if (anthropicConfig?.text_editor) return anthropicConfig.text_editor;

  const tools = Array.isArray(anthropicConfig?.tools) ? anthropicConfig.tools : [];
  return tools.find(
    (tool: any) => hasTextEditorType(tool?.type) || TEXT_EDITOR_TOOL_NAMES.includes(tool?.name)
  );
};

export function useAnthropicTextEditorToolCall(opts: {
  files?: FilesContextType | null;
  enabled?: boolean;
  config?: any;
}) {
  const files = opts.files ?? null;
  const enabled = !!opts.enabled;
  const maxCharacters = Number.isFinite(opts.config?.max_characters)
    ? Number(opts.config.max_characters)
    : undefined;

  const handleAnthropicTextEditorToolCall = useCallback(
    async (toolCall: AnthropicTextEditorToolCall): Promise<ToolTextResult> => {
      try {
        if (!enabled) {
          throw new Error("Anthropic text editor tool is not enabled for the active model.");
        }
        if (!files) throw new Error("Files context not available.");

        const { command } = toolCall.input ?? {};

        switch (command) {
          case "view": {
            const normalizedPath = normalizePath(toolCall.input?.path);
            if (!normalizedPath) {
              return ok(listAllowedTextFiles(files));
            }

            const file = await resolveFileByName(files, normalizedPath);
            const content = await file.data.text();
            const numbered = formatLineNumberedText(content, toolCall.input?.view_range);
            return ok(truncateText(numbered, maxCharacters));
          }

          case "create": {
            const normalizedPath = normalizePath(toolCall.input?.path);
            if (!normalizedPath) throw new Error("Missing path.");
            if (!isAllowedTextFile(normalizedPath, inferMimeType(normalizedPath))) {
              throw new Error("Error: Only text file types are supported by the Anthropic text editor tool.");
            }

            const existing = files.items.find((file) => file.name === normalizedPath);
            if (existing) throw new Error("Error: File already exists");

            await files.create({
              name: normalizedPath,
              mimeType: inferMimeType(normalizedPath),
              data: new Blob([String(toolCall.input?.file_text ?? "")], {
                type: inferMimeType(normalizedPath),
              }),
            });

            return ok(`Successfully created file ${normalizedPath}.`);
          }

          case "str_replace": {
            const normalizedPath = normalizePath(toolCall.input?.path);
            if (!normalizedPath) throw new Error("Missing path.");

            const oldStr = String(toolCall.input?.old_str ?? "");
            const newStr = String(toolCall.input?.new_str ?? "");
            if (!oldStr.length) {
              throw new Error("Error: old_str must be a non-empty string.");
            }

            const file = await resolveFileByName(files, normalizedPath);
            const content = await file.data.text();
            const matchCount = countOccurrences(content, oldStr);

            if (matchCount === 0) {
              throw new Error(
                "Error: No match found for replacement. Please check your text and try again."
              );
            }
            if (matchCount > 1) {
              throw new Error(
                `Error: Found ${matchCount} matches for replacement text. Please provide more context to make a unique match.`
              );
            }

            const updatedContent = content.replace(oldStr, newStr);
            await files.delete(file.id);
            await files.create({
              name: file.name,
              mimeType: file.data.type || inferMimeType(file.name),
              data: new Blob([updatedContent], {
                type: file.data.type || inferMimeType(file.name),
              }),
            });

            return ok("Successfully replaced text at exactly one location.");
          }

          case "insert": {
            const normalizedPath = normalizePath(toolCall.input?.path);
            if (!normalizedPath) throw new Error("Missing path.");

            const insertLine = toolCall.input?.insert_line;
            if (!Number.isInteger(insertLine) || insertLine < 0) {
              throw new Error("Error: insert_line must be an integer >= 0.");
            }

            const file = await resolveFileByName(files, normalizedPath);
            const content = await file.data.text();
            const lines = splitFileLines(content);

            if (insertLine > lines.length) {
              throw new Error(
                `Error: insert_line ${insertLine} is out of range for a file with ${lines.length} lines.`
              );
            }

            lines.splice(insertLine, 0, ...String(toolCall.input?.insert_text ?? "").split("\n"));
            const updatedContent = lines.join("\n");

            await files.delete(file.id);
            await files.create({
              name: file.name,
              mimeType: file.data.type || inferMimeType(file.name),
              data: new Blob([updatedContent], {
                type: file.data.type || inferMimeType(file.name),
              }),
            });

            return ok(`Successfully inserted text after line ${insertLine}.`);
          }

          default:
            throw new Error(`Unknown Anthropic text editor command: ${String(command ?? "")}`);
        }
      } catch (error) {
        return fail(error);
      }
    },
    [enabled, files, maxCharacters]
  );

  const anthropicTextEditorPlugin: ToolPlugin = {
    name: "anthropic-text-editor",
    match: (toolName) => TEXT_EDITOR_TOOL_NAMES.includes(toolName as any),
    handle: handleAnthropicTextEditorToolCall,
  };

  return { anthropicTextEditorPlugin };
}
