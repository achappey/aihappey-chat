import type { FileStore } from "aihappey-files";
import { applyDiff } from "./applyDiff";

export type ApplyPatchResult = {
  isError: boolean;
  content: { type: "text"; text: string }[];
  structuredContent: { status: "completed" | "failed"; output: string };
};

export const patchResult = (status: "completed" | "failed", output: string): ApplyPatchResult => ({
  isError: status === "failed",
  content: [{ type: "text", text: output }],
  structuredContent: { status, output },
});

export const getOpenAIApplyPatchConfig = (config: any) =>
  (Array.isArray(config?.tools) ? config.tools : []).find((tool: any) => tool?.type === "apply_patch")
  ?? config?.apply_patch;

export const flatPatchPath = (value: unknown): string => {
  if (typeof value !== "string" || !value.trim() || value !== value.trim()
    || value === "." || value === ".." || /[\\/:\x00-\x1f\x7f]/.test(value)) {
    throw new Error("Apply Patch supports exact flat filenames only. Directory paths and traversal are not supported in browser storage.");
  }
  return value;
};

// Shared across hook rerenders and calls: operations in a response observe earlier
// persisted edits, never the React items snapshot captured before those edits.
let pending: Promise<unknown> = Promise.resolve();

export function executeBrowserPatch(
  files: FileStore, input: any, enabled: boolean,
  isText: (name: string, mimeType?: string) => boolean,
  mimeType: (name: string) => string,
  signal?: AbortSignal,
): Promise<ApplyPatchResult> {
  const run = async (): Promise<ApplyPatchResult> => {
    try {
      signal?.throwIfAborted();
      if (!enabled) throw new Error("OpenAI Apply Patch is not enabled for the active model.");
      const operation = input?.operation;
      if (!operation || !["create_file", "update_file", "delete_file"].includes(operation.type)) {
        throw new Error("Invalid Apply Patch operation. Expected create_file, update_file, or delete_file.");
      }
      const path = flatPatchPath(operation.path);
      if (operation.type !== "delete_file" && typeof operation.diff !== "string") throw new Error("A V4A diff is required.");
      if (operation.diff?.length > 2_000_000) throw new Error("Patch exceeds the supported size limit.");
      const matches = (await files.list()).filter(file => file.name === path);
      if (matches.length > 1) throw new Error("Multiple files have this name. Rename duplicates before applying a patch.");
      if (operation.type === "create_file") {
        if (matches.length) throw new Error(`File already exists: ${path}`);
        const text = applyDiff("", operation.diff, "create");
        signal?.throwIfAborted();
        await files.create({ name: path, mimeType: mimeType(path), data: new Blob([text], { type: mimeType(path) }) });
      } else {
        const file = matches.length ? await files.read(matches[0].id) : undefined;
        if (!file) throw new Error(`File not found: ${path}`);
        if (!isText(file.name, file.data.type)) throw new Error("Only text files are supported by Apply Patch.");
        if (file.data.size > 10_000_000) throw new Error("File exceeds the supported size limit.");
        signal?.throwIfAborted();
        if (operation.type === "delete_file") await files.delete(file.id, file.data);
        else {
          const bytes = new Uint8Array(await file.data.arrayBuffer());
          const bom = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
          const current = new TextDecoder("utf-8", { fatal: true }).decode(bom ? bytes.subarray(3) : bytes);
          if (current.includes("\0")) throw new Error("Binary files are not supported by Apply Patch.");
          const text = applyDiff(current, operation.diff);
          signal?.throwIfAborted();
          await files.replace(file.id, new Blob(bom ? [new Uint8Array([0xef, 0xbb, 0xbf]), text] : [text], { type: file.data.type || mimeType(path) }), file.data);
        }
      }
      return patchResult("completed", `${operation.type}: ${path}`);
    } catch (error) {
      return patchResult("failed", error instanceof Error ? error.message : String(error));
    }
  };
  const result = pending.then(run, run);
  pending = result;
  return result;
}
