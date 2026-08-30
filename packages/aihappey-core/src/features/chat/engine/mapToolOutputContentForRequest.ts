import type { ToolOutputContentSettings } from "aihappey-state";

type ToolOutputCategory = keyof ToolOutputContentSettings;

const OMITTED_TEXT: Record<ToolOutputCategory, string> = {
  text: "Text content omitted by user settings.",
  images: "Image content omitted by user settings.",
  audio: "Audio content omitted by user settings.",
  video: "Video content omitted by user settings.",
  documents: "Document content omitted by user settings.",
};

const contentCategory = (content: any): ToolOutputCategory | undefined => {
  if (!content || typeof content !== "object" || Array.isArray(content)) return undefined;
  if (content.type === "text") return "text";

  const mimeType = content.type === "resource"
    ? content.resource?.mimeType
    : content.mimeType;
  if (typeof mimeType !== "string") return undefined;

  const normalized = mimeType.trim().toLowerCase();
  if (
    normalized.startsWith("text/")
    || normalized === "application/json"
    || normalized.endsWith("+json")
    || normalized === "application/xml"
    || normalized.endsWith("+xml")
    || normalized === "application/javascript"
    || normalized === "application/x-javascript"
    || normalized === "application/graphql"
  ) return "text";
  if (normalized.startsWith("image/")) return "images";
  if (normalized.startsWith("audio/")) return "audio";
  if (normalized.startsWith("video/")) return "video";
  if (normalized.startsWith("application/")) return "documents";
  return undefined;
};

const mapToolPart = (part: any, settings: ToolOutputContentSettings) => {
  if (!part || typeof part !== "object" || part.providerExecuted !== false) return part;

  const output = part.output;
  if (!output || typeof output !== "object" || Array.isArray(output) || !Array.isArray(output.content)) {
    return part;
  }

  let changed = false;
  const content = output.content.map((item: any) => {
    const category = contentCategory(item);
    if (!category || settings[category]) return item;

    changed = true;
    return { type: "text", text: OMITTED_TEXT[category] };
  });

  return changed
    ? { ...part, output: { ...output, content } }
    : part;
};

/** Creates a request-only view without changing live or persisted messages. */
export const mapToolOutputContentForRequest = (
  messages: any[] | undefined,
  settings: ToolOutputContentSettings,
): any[] => (messages ?? []).map((message) => {
  if (!message || typeof message !== "object" || !Array.isArray(message.parts)) return message;

  let changed = false;
  const parts = message.parts.map((part: any) => {
    const mapped = mapToolPart(part, settings);
    if (mapped !== part) changed = true;
    return mapped;
  });

  return changed ? { ...message, parts } : message;
});
