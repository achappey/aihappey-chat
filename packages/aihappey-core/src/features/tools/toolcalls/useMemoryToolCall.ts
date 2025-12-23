import { useCallback } from "react";
import { memoryStore as defaultMemoryStore } from "../../../runtime/memory/memoryStore";

type ToolTextResult = {
  isError: boolean;
  content: { type: "text"; text: string }[];
};

type MemoryCommand =
  | "view"
  | "create"
  | "str_replace"
  | "insert"
  | "delete"
  | "rename";

type MemoryToolCall = {
  toolName: "memory";
  input: Record<string, any> & { command: MemoryCommand };
};

function ok(text: string): ToolTextResult {
  return { isError: false, content: [{ type: "text", text }] };
}

function fail(err: unknown): ToolTextResult {
  const message = err instanceof Error ? err.message : String(err);
  return { isError: true, content: [{ type: "text", text: message }] };
}

export function useMemoryToolCall(opts?: {
  store?: typeof defaultMemoryStore;
  root?: string; // default "/memories"
}) {
  const store = opts?.store ?? defaultMemoryStore;
  const root = opts?.root ?? "/memories";

  const normalize = useCallback(
    (p: string): string => {
      if (typeof p !== "string" || !p.length) throw new Error("Missing path.");
      const path = p.replace(/\\/g, "/");
      if (!path.startsWith(root)) {
        throw new Error(`Invalid path. All memory files must be under ${root}.`);
      }
      return path;
    },
    [root]
  );

  const handleMemoryToolCall = useCallback(
    async (toolCall: MemoryToolCall): Promise<ToolTextResult> => {
      try {
        const { command } = toolCall.input;

        switch (command) {
          case "view": {
            const path = normalize(toolCall.input.path);
            const viewRange = toolCall.input.view_range;
            const result = await store.view(path, viewRange);
            return ok(result);
          }

          case "create": {
            const path = normalize(toolCall.input.path);
            const fileText = toolCall.input.file_text ?? "";
            await store.create(path, fileText);
            return ok("OK");
          }

          case "str_replace": {
            const path = normalize(toolCall.input.path);
            const { old_str, new_str } = toolCall.input;
            await store.replace(path, old_str, new_str);
            return ok("OK");
          }

          case "insert": {
            const path = normalize(toolCall.input.path);
            const { insert_line, insert_text } = toolCall.input;
            await store.insert(path, insert_line, insert_text);
            return ok("OK");
          }

          case "delete": {
            const path = normalize(toolCall.input.path);
            await store.delete(path);
            return ok("OK");
          }

          case "rename": {
            const oldPath = normalize(toolCall.input.old_path);
            const newPath = normalize(toolCall.input.new_path);
            await store.rename(oldPath, newPath);
            return ok("OK");
          }

          default:
            throw new Error(`Unknown memory command: ${command}`);
        }
      } catch (e) {
        return fail(e);
      }
    },
    [normalize, store]
  );

  return { handleMemoryToolCall };
}
