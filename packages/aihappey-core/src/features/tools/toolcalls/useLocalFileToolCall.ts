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
  content: [
    {
      type: "text",
      text: err instanceof Error ? err.message : String(err),
    },
  ],
});

/* ============================================================
   Tool definitions (STATIC)
   - no hooks
   - reusable everywhere
============================================================ */

export const localFileListTool: Tool = {
  name: "local_file_list",
  title: "List local files",
  description: "List all locally stored files.",
  inputSchema: { type: "object", properties: {} },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};

export const localFileReadTool: Tool = {
  name: "local_file_read",
  title: "Read local file",
  description: "Read the contents of a local file by name.",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Exact file name." },
    },
    required: ["name"],
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};

export const localFileCreateTool: Tool = {
  name: "local_file_create",
  title: "Create local file",
  description: "Create a new local file.",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string", description: "File name." },
      mimeType: { type: "string", description: "MIME type." },
      data: { type: "string", description: "File contents as string." },
    },
    required: ["name", "data", "mimeType"],
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
  },
};

export const localFileDeleteTool: Tool = {
  name: "local_file_delete",
  title: "Delete local file",
  description: "Delete a local file by name.",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Exact file name." },
    },
    required: ["name"],
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
  },
};

/* ============================================================
   Plugin DEFINITION (STATIC)
============================================================ */

export const localFilesPluginDef = {
  name: "local-files",
  match: (toolName: string) => toolName.startsWith("local_file_"),
  tools: [
    localFileListTool,
    localFileReadTool,
    localFileCreateTool,
    localFileDeleteTool,
  ],
};

/* ============================================================
   Runtime helpers
============================================================ */

async function resolveFileByName(files: FilesContextType, name: string) {
  if (!name?.trim()) throw new Error("File name is required.");
  return files.items.find(f => f.name === name);
}

type LocalFileToolCall = {
  toolName:
    | "local_file_list"
    | "local_file_read"
    | "local_file_create"
    | "local_file_delete";
  input?: any;
};

/* ============================================================
   Plugin RUNTIME (execution only)
============================================================ */

export function useLocalFilesRuntime(files?: FilesContextType | null) {
  const handle = useCallback(
    async (toolCall: LocalFileToolCall): Promise<ToolTextResult> => {
      try {
        if (!files) throw new Error("Files context not available.");

        switch (toolCall.toolName) {
          case "local_file_list": {
            const list = files.items
              .map(f => `${f.name} (${new Date(f.createdAt).toISOString()})`)
              .join("\n");
            return ok(list || "No files.");
          }

          case "local_file_read": {
            const { name } = toolCall.input ?? {};
            if (!name) throw new Error("Missing file name.");

            const file = await resolveFileByName(files, name);
            if (!file) throw new Error("File not found.");

            const stored = await files.read(file.id);
            if (!stored) throw new Error("File not found.");

            return ok(await stored.data.text());
          }

          case "local_file_create": {
            const { name, mimeType, data } = toolCall.input ?? {};
            if (!name) throw new Error("Missing file name.");
            if (data == null) throw new Error("Missing file data.");

            const blob =
              data instanceof Blob
                ? data
                : new Blob([String(data)], {
                    type: mimeType ?? "text/plain",
                  });

            await files.create({
              name,
              mimeType: mimeType ?? blob.type ?? "application/octet-stream",
              data: blob,
            });

            return ok("OK");
          }

          case "local_file_delete": {
            const { name } = toolCall.input ?? {};
            if (!name) throw new Error("Missing file name.");

            const file = await resolveFileByName(files, name);
            if (!file) throw new Error("File not found.");

            await files.delete(file.id);
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
    name: localFilesPluginDef.name,
    handle,
  };
}
