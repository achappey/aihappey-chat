import { useCallback } from "react";
import type { FilesContextType } from "aihappey-files";
import type { Tool } from "@modelcontextprotocol/sdk/types";

/* ============================================================
   Result helpers
============================================================ */

type ToolTextResult = {
  isError: boolean;
  content: { type: "text"; text: string }[];
};

const ok = (text: string): ToolTextResult => ({
  isError: false,
  content: [{ type: "text", text }],
});

const fail = (err: unknown): ToolTextResult => ({
  isError: true,
  content: [{ type: "text", text: err instanceof Error ? err.message : String(err) }],
});

/* ============================================================
   Tool definitions (STATIC)
============================================================ */

export const localCanvasReadTool: Tool = {
  name: "local_canvas_read",
  title: "Read local canvas",
  description: "Read a local markdown canvas (.md) file. Optionally read a specific line range.",
  inputSchema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description:
          "Canvas path (e.g. /Projects/Notes/Todo.md). '.md' is auto-appended if missing.",
      },
      view_range: {
        type: "array",
        description: "Optional [startLine, endLine] (1-based).",
        items: { type: "number" },
        minItems: 2,
        maxItems: 2,
      },
    },
    required: ["path"],
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};

export const localCanvasCreateTool: Tool = {
  name: "local_canvas_create",
  title: "Create canvas",
  description: "Create or overwrite a local markdown canvas (.md) file.",
  inputSchema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description:
          "Canvas file path (e.g. /Projects/Notes/Todo.md). '.md' is auto-appended if missing.",
      },
      file_text: {
        type: "string",
        description: "Markdown content to write.",
      },
    },
    required: ["path", "file_text"],
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
  },
};

export const localCanvasInsertTool: Tool = {
  name: "local_canvas_insert",
  title: "Insert canvas line",
  description: "Insert a line into a local markdown canvas at a given 1-based line index.",
  inputSchema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Canvas file path (e.g. /Projects/Notes/Todo.md).",
      },
      insert_line: {
        type: "number",
        description: "1-based line number to insert at. If beyond EOF, appends.",
      },
      insert_text: {
        type: "string",
        description: "Text to insert at the specified line.",
      },
    },
    required: ["path", "insert_line", "insert_text"],
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
  },
};

export const localCanvasReplaceTool: Tool = {
  name: "local_canvas_replace",
  title: "Replace canvas text",
  description: "Replace text inside a local markdown canvas using simple find/replace.",
  inputSchema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Canvas file path (e.g. /Projects/Notes/Todo.md).",
      },
      old_str: {
        type: "string",
        description: "Text to find.",
      },
      new_str: {
        type: "string",
        description: "Replacement text.",
      },
    },
    required: ["path", "old_str", "new_str"],
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
  },
};

/* ============================================================
   Plugin definition (STATIC)
============================================================ */

export const localCanvasPluginDef = {
  name: "local-canvas",
  match: (toolName: string) => toolName.startsWith("local_canvas_"),
  tools: [localCanvasCreateTool, localCanvasInsertTool, localCanvasReadTool, localCanvasReplaceTool],
};

/* ============================================================
   Helpers
============================================================ */

function normalizePath(path: string) {
  if (!path?.trim()) throw new Error("Path is required.");
  let p = path.replace(/\\/g, "/").trim();
  if (!p.startsWith("/")) p = "/" + p;
  if (!p.toLowerCase().endsWith(".md")) p += ".md";
  return p;
}

function fileNameFromPath(path: string) {
  return normalizePath(path).split("/").pop()!;
}

async function resolveFile(files: FilesContextType, path: string) {
  const name = fileNameFromPath(path);
  return files.items.find(f => f.name === name);
}

async function canvasReplace(files: FilesContextType, fileId: string, name: string, text: string) {
  await files.delete(fileId);

  return await files.create({
    name,
    mimeType: "text/markdown",
    data: new Blob([text], { type: "text/markdown" }),
  });
}

/* ============================================================
   Runtime types
============================================================ */

type LocalCanvasToolName =
  | "local_canvas_read"
  | "local_canvas_create"
  | "local_canvas_insert"
  | "local_canvas_replace";

type LocalCanvasToolCall = {
  toolName: LocalCanvasToolName;
  input: any;
};

/* ============================================================
   Runtime (execution only)
============================================================ */

export function useLocalCanvasRuntime(files?: FilesContextType | null) {
  const handle = useCallback(
    async (toolCall: LocalCanvasToolCall): Promise<ToolTextResult> => {
      try {
        if (!files) throw new Error("Files context not available.");

        switch (toolCall.toolName) {
          case "local_canvas_read": {
            const { path, view_range } = toolCall.input ?? {};
            if (!path) throw new Error("Missing path.");

            const file = await resolveFile(files, path);
            if (!file) throw new Error("File not found.");

            const stored = await files.read(file.id);
            if (!stored) throw new Error("File not found.");

            let text = await stored.data.text();

            if (Array.isArray(view_range) && view_range.length === 2) {
              const lines = text.split("\n");
              const start = Math.max(1, Number(view_range[0] ?? 1));
              const end = Math.min(lines.length, Number(view_range[1] ?? lines.length));
              if (start <= end) text = lines.slice(start - 1, end).join("\n");
            }

            return ok(text);
          }

          case "local_canvas_create": {
            const { path, file_text } = toolCall.input ?? {};
            if (!path) throw new Error("Missing path.");

            const name = fileNameFromPath(path);
            const blobText = String(file_text ?? "");

            const existing = await resolveFile(files, path);
            if (existing) {
              await canvasReplace(files, existing.id, name, blobText);
              return ok("OK");
            }

            await files.create({
              name,
              mimeType: "text/markdown",
              data: new Blob([blobText], { type: "text/markdown" }),
            });

            return ok("OK");
          }

          case "local_canvas_insert": {
            const { path, insert_line, insert_text } = toolCall.input ?? {};
            if (!path) throw new Error("Missing path.");

            const file = await resolveFile(files, path);
            if (!file) throw new Error("File not found.");

            const stored = await files.read(file.id);
            if (!stored) throw new Error("File not found.");

            const lines = (await stored.data.text()).split("\n");
            const line = Math.max(1, Number(insert_line ?? 1));
            const text = String(insert_text ?? "");

            if (line > lines.length + 1) lines.push(text);
            else lines.splice(line - 1, 0, text);

            await canvasReplace(files, file.id, file.name, lines.join("\n"));
            return ok("OK");
          }

          case "local_canvas_replace": {
            const { path, old_str, new_str } = toolCall.input ?? {};
            if (!path) throw new Error("Missing path.");

            const file = await resolveFile(files, path);
            if (!file) throw new Error("File not found.");

            const stored = await files.read(file.id);
            if (!stored) throw new Error("File not found.");

            const updated = (await stored.data.text()).replace(String(old_str ?? ""), String(new_str ?? ""));

            await canvasReplace(files, file.id, file.name, updated);
            return ok("OK");
          }

          default:
            throw new Error(`Unsupported tool: ${toolCall.toolName}`);
        }
      } catch (e) {
        return fail(e);
      }
    },
    [files]
  );

  return {
    name: localCanvasPluginDef.name,
    handle,
  };
}
