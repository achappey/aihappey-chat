import { useCallback } from "react";
import type { FilesContextType } from "aihappey-files";
import type { Tool } from "@modelcontextprotocol/sdk/types";
import { extractTextFromFile } from "../../chat/files/file";
import { extractTextFromZip } from "../../chat/files/fileConverters";

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

export const localFileRenameTool: Tool = {
  name: "local_file_rename",
  title: "Rename local file",
  description: "Rename a local file.",
  inputSchema: {
    type: "object",
    properties: {
      oldName: { type: "string", description: "Current exact file name." },
      newName: { type: "string", description: "New file name." },
    },
    required: ["oldName", "newName"],
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
  },
};

export const localFileConvertToTextTool: Tool = {
  name: "local_file_convert_to_text",
  title: "Convert local file to text",
  description:
    "Convert a locally stored file to text using the same local attachment conversion pipeline and save it as a new .txt file with the same base name.",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Exact local file name to convert." },
    },
    required: ["name"],
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
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
    localFileRenameTool,
    localFileConvertToTextTool,
  ],
};

/* ============================================================
   Runtime helpers
============================================================ */

async function resolveFileByName(files: FilesContextType, name: string) {
  if (!name?.trim()) throw new Error("File name is required.");
  return files.items.find(f => f.name === name);
}

function wrapBlobAsFile(blob: Blob, name: string) {
  // The existing file-to-text pipeline operates on `File` objects.
  // Wrap the stored Blob into a File to reuse those converters.
  return new File([blob], name, {
    type: blob.type || "application/octet-stream",
  });
}

function textFilenameFromName(name: string) {
  const trimmed = name.trim();
  const slashIndex = Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\"));
  const dotIndex = trimmed.lastIndexOf(".");
  const hasExtension = dotIndex > slashIndex;
  return `${hasExtension ? trimmed.slice(0, dotIndex) : trimmed}.txt`;
}

async function convertFileToText(asFile: File): Promise<string | undefined> {
  if (asFile.type === "application/zip" || /\.zip$/i.test(asFile.name)) {
    const parts = await extractTextFromZip(asFile);
    const texts = parts
      .filter(p => p?.type === "text" && typeof p.text === "string")
      .map(p => p.text)
      .filter(Boolean);

    return texts.length ? texts.join("\n\n") : undefined;
  }

  return await extractTextFromFile(asFile);
}

type LocalFileToolCall = {
  toolName:
    | "local_file_list"
    | "local_file_read"
    | "local_file_create"
    | "local_file_delete"
    | "local_file_rename"
    | "local_file_convert_to_text";
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

            const asFile = wrapBlobAsFile(stored.data, file.name);

            // Match chat attachment behavior:
            // - if ZIP, expand to multiple text parts
            // - else, attempt conversion for supported formats
            // - if unsupported, fall back to Blob.text() (previous behavior)
            if (asFile.type === "application/zip" || /\.zip$/i.test(asFile.name)) {
              const parts = await extractTextFromZip(asFile);
              const texts = parts
                .filter(p => p?.type === "text" && typeof p.text === "string")
                .map(p => p.text);
              return okMany(texts.length ? texts : [await stored.data.text()]);
            }

            const converted = await extractTextFromFile(asFile);
            return ok(converted ?? (await stored.data.text()));
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

          case "local_file_rename": {
            const { oldName, newName } = toolCall.input ?? {};
            const normalizedOldName = String(oldName ?? "").trim();
            const normalizedNewName = String(newName ?? "").trim();
            if (!normalizedOldName) throw new Error("Missing oldName.");
            if (!normalizedNewName) throw new Error("Missing newName.");

            if (normalizedOldName === normalizedNewName) return ok("OK");

            const file = await resolveFileByName(files, normalizedOldName);
            if (!file) throw new Error("File not found.");

            const existing = await resolveFileByName(files, normalizedNewName);
            if (existing) throw new Error("File already exists.");

            await files.rename(file.id, normalizedNewName);
            return ok("OK");
          }

          case "local_file_convert_to_text": {
            const { name } = toolCall.input ?? {};
            const normalizedName = String(name ?? "").trim();
            if (!normalizedName) throw new Error("Missing file name.");

            const file = await resolveFileByName(files, normalizedName);
            if (!file) throw new Error("File not found.");

            const outputName = textFilenameFromName(file.name);
            const existing = await resolveFileByName(files, outputName);
            if (existing) throw new Error(`Destination file already exists: ${outputName}`);

            const stored = await files.read(file.id);
            if (!stored) throw new Error("File not found.");

            const asFile = wrapBlobAsFile(stored.data, file.name);
            const converted = await convertFileToText(asFile);
            if (!converted?.trim()) {
              throw new Error("File could not be converted to text.");
            }

            await files.create({
              name: outputName,
              mimeType: "text/plain",
              data: new Blob([converted], { type: "text/plain" }),
            });

            return ok(`Created ${outputName}`);
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
