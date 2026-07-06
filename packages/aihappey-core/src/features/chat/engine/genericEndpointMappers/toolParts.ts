export const asRecord = (value: unknown): Record<string, any> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, any>
    : undefined;

export const nonEmptyString = (value: unknown): string | undefined => {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length ? text : undefined;
};

export const stringifyToolValue = (value: unknown) => {
  if (typeof value === "string") return value;
  if (value === undefined || value === null) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

export const toolPartCallId = (part: any) =>
  nonEmptyString(part?.toolCallId ?? part?.call_id ?? part?.tool_call_id ?? part?.callId ?? part?.id);

export const toolPartName = (part: any, fallback = "tool") => {
  const fromType = String(part?.type ?? "").replace(/^tool-/, "");
  return nonEmptyString(part?.toolName ?? part?.name ?? part?.function?.name ?? fromType) ?? fallback;
};

export const toolPartInput = (part: any) => part?.input ?? part?.args ?? part?.arguments ?? part?.function?.arguments ?? {};

export const toolPartOutput = (part: any) => part?.output ?? part?.result;

export const hasToolPartOutput = (part: any) => toolPartOutput(part) !== undefined;

export const isOutputOnlyToolPart = (part: any) => {
  const type = String(part?.type ?? "").toLowerCase();
  const state = String(part?.state ?? "").toLowerCase();
  return type === "function_call_output"
    || type === "tool-output-available"
    || state === "output-only"
    || state === "output_only";
};

export const isClientExecutableToolPart = (part: any) => part?.providerExecuted !== true;
