import { applyDiff } from "../../../tools/applyPatch/applyDiff";

const editorNames = new Set(["str_replace_based_edit_tool", "str_replace_editor"]);
const canvasNames = new Set(["local_canvas_create", "local_canvas_insert", "local_canvas_replace", "local_canvas_read"]);
const maximumCharacters = 2_000_000;

const parseInput = (input: any): any => {
  try {
    const value = typeof input === "string" ? JSON.parse(input) : input;
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch { return {}; }
};

// Only completed, released results are evidence of a successful document operation.
export const successfulDocumentCall = (part: any): boolean => {
  const output = part?.output;
  return !!output && typeof output === "object"
    && part?.approval?.approved !== false && part?.providerExecuted !== true
    && (part?.state === undefined || ["output-available", "approval-responded"].includes(part.state))
    && output.isError !== true && output?.structuredContent?.status !== "failed"
    && (output.isError === false || output?.structuredContent?.status === "completed");
};

const documentPath = (toolName: string, value: unknown): string | undefined => {
  if (typeof value !== "string" || !value.trim() || /[:\x00-\x1f\x7f]/.test(value)) return;
  let path = value.replace(/\\/g, "/").trim();
  if (path.startsWith("//")) return;
  if (toolName === "apply_patch") {
    if (path !== value || path.includes("/")) return;
  } else {
    path = path.replace(/^\//, "");
    if (toolName.startsWith("local_canvas_")) {
      if (!path.toLowerCase().endsWith(".md")) path += ".md";
    } else {
      path = path.replace(/^\.\//, "");
      if (path.includes("/")) return;
    }
  }
  if (path.split("/").some(segment => !segment || segment === "." || segment === "..")) return;
  // The browser Canvas runtime stores the basename in its flat file workspace.
  return path.split("/").pop();
};

export type LocalCanvasHistoryResource = {
  uri: string;
  mimeType: "text/markdown" | "text/plain";
  text: string;
  _msgId: string;
  _partIndex: number;
  _ts: string;
  _localDocument: true;
};

/** Pure projection: never reads files, mutates results, or executes a tool. */
export function extractLocalCanvasHistory(invocations: any[]): LocalCanvasHistoryResource[] {
  const known = new Map<string, string>();
  const resources: LocalCanvasHistoryResource[] = [];
  for (const part of invocations) {
    const name = String(part?.toolName ?? part?.type ?? "").replace(/^tool-/, "");
    if (name !== "apply_patch" && !editorNames.has(name) && !canvasNames.has(name)) continue;
    const input = parseInput(part.input);
    const operation = name === "apply_patch" ? input.operation : input;
    const path = documentPath(name, operation?.path);
    if (!path) continue;
    const mimeType = /\.(md|markdown)$/i.test(path) ? "text/markdown"
      : /\.(txt|text)$/i.test(path) ? "text/plain" : undefined;
    if (!mimeType) continue;
    const uri = `localcanvas:///${encodeURIComponent(path)}`;
    const command = name === "apply_patch" ? operation?.type : editorNames.has(name) ? input.command : name;
    // Reads do not seed or replace the complete creation-based baseline, particularly ranged/truncated views.
    if (command === "view" || command === "local_canvas_read") continue;
    if (!successfulDocumentCall(part)) {
      // A denied or interrupted result may follow a real mutation; do not replay later edits on stale content.
      if (part?.output?.isError !== true && part?.output?.structuredContent?.status !== "failed") known.delete(uri);
      continue;
    }
    if (command === "delete_file") { known.delete(uri); continue; }
    try {
      let text: string;
      if (command === "create_file") {
        if (typeof operation?.diff !== "string" || operation.diff.length > maximumCharacters) throw Error();
        text = applyDiff("", operation.diff, "create");
      } else if (command === "create" || command === "local_canvas_create") {
        if (typeof input.file_text !== "string") throw Error();
        text = input.file_text;
      } else {
        const previous = known.get(uri);
        if (previous === undefined) continue;
        if (command === "update_file") {
          if (typeof operation?.diff !== "string" || operation.diff.length > maximumCharacters) throw Error();
          text = applyDiff(previous, operation.diff);
        } else if (command === "str_replace" || command === "local_canvas_replace") {
          const old = input.old_str;
          if (typeof old !== "string" || !old || typeof input.new_str !== "string") throw Error();
          const index = previous.indexOf(old);
          if (index < 0 || (command === "str_replace" && previous.indexOf(old, index + old.length) >= 0)) throw Error();
          // Literal replacement; '$&' and similar strings are document text, not JS replacement patterns.
          text = previous.slice(0, index) + input.new_str + previous.slice(index + old.length);
        } else if (command === "insert" || command === "local_canvas_insert") {
          if (!Number.isInteger(input.insert_line) || typeof input.insert_text !== "string") throw Error();
          const lines = command === "insert" && !previous.length ? [] : previous.split("\n");
          if (command === "insert") {
            if (input.insert_line < 0 || input.insert_line > lines.length) throw Error();
            lines.splice(input.insert_line, 0, ...input.insert_text.split("\n"));
          } else lines.splice(Math.min(Math.max(1, input.insert_line) - 1, lines.length), 0, input.insert_text);
          text = lines.join("\n");
        } else { known.delete(uri); continue; }
      }
      if (text.length > maximumCharacters || text.includes("\0")) throw Error();
      known.set(uri, text);
      resources.push({ uri, mimeType, text, _msgId: part.msgId, _partIndex: part.partIndex,
        _ts: part?.metadata?.timestamp ?? "", _localDocument: true });
    } catch { known.delete(uri); }
  }
  return resources;
}
