import {
  OPENAI_CLIENT_TOOL_SEARCH_NAME,
  selectedToolsFromClientToolSearchResult,
} from "../../../tools/clientToolSearch";
import {
  compactObject,
  getProviderKeyFromRequestBody,
  hasConfiguredNativeTools,
  mergeNativeTools,
  normalizeToolChoice,
  resolveNativeEndpointMetadata,
  mergeNativeRequestBody,
  resolveOpenAiToolChoice,
  sanitizeGenericEndpointProviderRequestConfig,
  type GenericChatEndpointRequestBody,
  type GenericMappedMessage,
} from "./types";
import { getSystemText, getTextFromPart, isReasoningPart, isToolPart, mapUiMessages, toInlineFileData } from "./uiMessageParts";

const responsesPartMetadata = (part: any, providerKey?: string) => {
  const key = providerKey ?? "openai";
  return {
    ...(part?.resultProviderMetadata?.[key] ?? {}),
    ...(part?.providerMetadata?.[key] ?? {}),
    ...(part?.callProviderMetadata?.[key] ?? {}),
  };
};

const responsesReasoningFromPart = (part: any, providerKey?: string) => {
  if (!providerKey) return undefined;

  const metadata = responsesPartMetadata(part, providerKey);
  const encryptedContent = metadata.encrypted_content;
  if (typeof encryptedContent !== "string" || !encryptedContent) return undefined;

  // Older saved browser parts used this decorated UI id. Recover the native id;
  // never truncate an opaque provider identifier or send the UI decoration back.
  const legacyId = typeof part?.id === "string" ? /^reasoning-(.+)-\d+$/.exec(part.id)?.[1] : undefined;
  const id = metadata.id ?? metadata.item_id ?? legacyId ?? part?.id;
  const summaryText = getTextFromPart(part);
  return {
    ...compactObject({
      type: "reasoning" as const,
      id,
      encrypted_content: encryptedContent,
    }),
    summary: Array.isArray(metadata.summary) ? metadata.summary
      : summaryText ? [{ type: "summary_text" as const, text: summaryText }] : [],
  };
};

const toResponsesContent = (message: GenericMappedMessage) => {
  const content: any[] = [];

  if (message.role === "assistant") {
    message.nonReasoningTextParts.forEach((text) => content.push({ type: "output_text", text }));
    return content;
  }

  if (message.text) content.push({ type: "input_text", text: message.text });

  message.fileParts.forEach((file) => {
    if (file.mimeType.startsWith("image/") && file.dataUrl) {
      content.push({ type: "input_image", image_url: file.dataUrl });
      return;
    }

    const fileData = toInlineFileData(file);
    if (fileData) content.push({ type: "input_file", file_data: fileData, filename: file.filename });
  });

  return content;
};

const stringifyToolValue = (value: unknown) => {
  if (typeof value === "string") return value;
  if (value === undefined || value === null) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const toolPartName = (part: any) => {
  const fromType = String(part?.type ?? "").replace(/^tool-/, "");
  return String(part?.toolName ?? part?.name ?? fromType ?? "function_call").trim() || "function_call";
};

const toolPartInput = (part: any) => part?.input ?? part?.args ?? part?.arguments ?? {};

const toolPartOutput = (part: any) => part?.output ?? part?.result;

const isOutputOnlyToolPart = (part: any) => {
  const type = String(part?.type ?? "").toLowerCase();
  const state = String(part?.state ?? "").toLowerCase();
  return type.includes("output") || state === "output-only" || state === "output_only";
};

const sanitizeNamespaceName = (value: unknown, fallback = "tools") => {
  const clean = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^[_-]+|[_-]+$/g, "")
    .slice(0, 64);
  return clean || fallback;
};

const uniqueNamespaceNames = (keys: string[]) => {
  const used = new Set<string>();
  const names = new Map<string, string>();
  for (const key of keys) {
    const base = sanitizeNamespaceName(key, "tools");
    let candidate = base;
    let suffix = 2;
    while (used.has(candidate)) candidate = `${base.slice(0, 60)}_${suffix++}`;
    used.add(candidate);
    names.set(key, candidate);
  }
  return names;
};

export const mapConfiguredOpenAiResponseTools = (body: GenericChatEndpointRequestBody) => {
  if (normalizeToolChoice(body.toolChoice) === "none") return [];
  const requestConfig = body.toolRequestConfig && typeof body.toolRequestConfig === "object"
    ? body.toolRequestConfig
    : {};
  const functions = (Array.isArray(body.tools) ? body.tools : []).flatMap((tool: any) => {
    const name = typeof tool?.name === "string" ? tool.name.trim() : "";
    if (!name) return [];
    const sourceConfigured = tool?.source?.requestOptions && typeof tool.source.requestOptions === "object"
      ? tool.source.requestOptions
      : {};
    const configured = Object.prototype.hasOwnProperty.call(requestConfig, name)
      ? requestConfig[name]
      : sourceConfigured;
    const allowedCallers = Array.isArray(configured.allowed_callers)
      ? configured.allowed_callers.filter((caller: unknown) => caller === "direct" || caller === "programmatic")
      : [];
    return [{
      type: "function" as const,
      name,
      description: typeof tool.description === "string" && tool.description.trim()
        ? tool.description.trim()
        : tool.annotations?.title,
      parameters: tool.inputSchema && typeof tool.inputSchema === "object"
        ? tool.inputSchema
        : tool.parameters && typeof tool.parameters === "object"
          ? tool.parameters
          : { type: "object", properties: {} },
      ...(allowedCallers.length ? { allowed_callers: allowedCallers } : {}),
      ...(configured.defer_loading ? { defer_loading: true } : {}),
      source: tool.source,
    }];
  });

  const hasForcedNamespaces = functions.some((tool: any) => tool?.source?.namespace === true);
  if (!body.useToolNamespaces && !hasForcedNamespaces) {
    return functions.map(({ source: _source, ...tool }) => tool);
  }

  const groups = new Map<string, { name: string; description?: string; tools: Array<Record<string, any>> }>();
  const ungrouped: Array<Record<string, any>> = [];
  for (const { source, ...tool } of functions) {
    if (!body.useToolNamespaces && source?.namespace !== true) {
      ungrouped.push(tool);
      continue;
    }
    const kind = source?.kind === "mcp" || source?.kind === "plugin" ? source.kind : "local";
    const id = kind === "local" ? "local" : String(source?.id ?? kind);
    const key = `${kind}:${id}`;
    const group: { name: string; description?: string; tools: Array<Record<string, any>> } = groups.get(key) ?? {
      name: kind === "local" ? "local" : String(source?.name ?? id),
      description: source?.description || (kind === "local"
        ? "Locally available application tools."
        : `Tools provided by ${source?.name ?? id}.`),
      tools: [],
    };
    group.tools.push(tool);
    groups.set(key, group);
  }

  const names = uniqueNamespaceNames([...groups.keys()].map((key) => groups.get(key)!.name));
  const claimedNames = new Set<string>();
  const namespaces = [...groups.values()].map((group) => {
    let name = names.get(group.name) ?? sanitizeNamespaceName(group.name);
    let suffix = 2;
    const base = name;
    while (claimedNames.has(name)) name = `${base.slice(0, 60)}_${suffix++}`;
    claimedNames.add(name);
    return { type: "namespace" as const, name, description: group.description, tools: group.tools };
  });
  return [...ungrouped, ...namespaces];
};

const toResponsesToolEntries = (part: any, providerKey?: string): any[] => {
  if (part?.providerExecuted === true) return [];
  // Input deltas and pending approvals are not replayable completed calls.
  if (part?.state === "input-streaming" || part?.state === "input-error" || part?.state === "approval-requested") return [];

  const providerMetadata = responsesPartMetadata(part, providerKey);
  const callId = String(providerMetadata.call_id ?? part?.call_id ?? part?.toolCallId ?? part?.id ?? "").trim();
  if (!callId) return [];

  const entries: any[] = [];
  const toolName = toolPartName(part);
  const isClientToolSearch = toolName === OPENAI_CLIENT_TOOL_SEARCH_NAME
    && (providerMetadata?.type === "tool_search_call" || providerMetadata?.execution === "client");

  if (toolName === "apply_patch" && providerMetadata?.type === "apply_patch_call") {
    if (!isOutputOnlyToolPart(part)) {
      entries.push(compactObject({
        type: "apply_patch_call",
        id: providerMetadata.id,
        call_id: providerMetadata.call_id ?? callId,
        status: "completed",
        operation: toolPartInput(part)?.operation,
        caller: providerMetadata.caller,
        created_by: providerMetadata.created_by,
      }));
    }
    const output = toolPartOutput(part);
    const denied = part?.approval?.approved === false || part?.state === "output-denied";
    if (output !== undefined || denied || part?.state === "output-error") {
      const result = output?.structuredContent ?? output;
      entries.push({
        type: "apply_patch_call_output",
        call_id: providerMetadata.call_id ?? callId,
        status: denied || part?.state === "output-error" || output?.isError || result?.status === "failed" ? "failed" : "completed",
        output: denied ? (part?.approval?.reason || "The user denied release of this tool result. File changes were not rolled back.")
          : result?.output ?? part?.errorText ?? stringifyToolValue(output),
        ...(providerMetadata.caller ? { caller: providerMetadata.caller } : {}),
      });
    }
    return entries;
  }

  if (isClientToolSearch) {
    if (!isOutputOnlyToolPart(part)) {
      entries.push(compactObject({
        type: "tool_search_call" as const,
        id: providerMetadata?.id,
        execution: "client",
        call_id: providerMetadata?.call_id ?? callId,
        status: providerMetadata?.status,
        arguments: toolPartInput(part),
      }));
    }

    const selectedTools = selectedToolsFromClientToolSearchResult(toolPartOutput(part));
    if (selectedTools) {
      entries.push({
        type: "tool_search_output" as const,
        execution: "client",
        call_id: providerMetadata?.call_id ?? callId,
        status: "completed",
        tools: selectedTools.map((tool: any) => ({
          type: "function",
          name: tool.name,
          ...(tool.description ? { description: tool.description } : {}),
          parameters: tool.inputSchema ?? { type: "object", properties: {} },
        })),
      });
    }
    return entries;
  }

  if (!isOutputOnlyToolPart(part)) {
    entries.push(compactObject({
      type: "function_call" as const,
      id: providerMetadata.id ?? providerMetadata.item_id,
      call_id: callId,
      name: toolName,
      namespace: part?.namespace ?? providerMetadata.namespace,
      arguments: stringifyToolValue(toolPartInput(part)),
      caller: part?.caller ?? providerMetadata.caller,
    }));
  }

  const output = toolPartOutput(part);
  const denied = part?.approval?.approved === false || part?.state === "output-denied";
  if (output !== undefined || denied || part?.state === "output-error") {
    entries.push(compactObject({
      type: "function_call_output" as const,
      call_id: callId,
      output: denied ? (part?.approval?.reason || "The user denied this tool result.")
        : part?.state === "output-error" ? (part?.errorText || stringifyToolValue(output) || "Tool execution failed.")
        : stringifyToolValue(output),
      caller: part?.caller ?? providerMetadata.caller,
    }));
  }

  return entries;
};

export const buildResponsesBody = (body: GenericChatEndpointRequestBody) => {
  const messages = mapUiMessages(body.messages);
  const providerKey = String(body.providerRequestConfigProviderKey ?? "").trim().toLowerCase()
    || (body.model?.includes("/") ? body.model.split("/")[0].toLowerCase() : undefined)
    || getProviderKeyFromRequestBody(body);
  const providerRequestConfig = sanitizeGenericEndpointProviderRequestConfig({
    ...body,
    endpoint: "/v1/responses",
  });
  const mappedTools = mapConfiguredOpenAiResponseTools(body);
  const activeTools = hasConfiguredNativeTools(providerRequestConfig)
    ? mergeNativeTools(providerRequestConfig?.tools, mappedTools)
    : mappedTools;
  const hasTools = Boolean(activeTools?.length);
  const reasoningById = new Map<string, any>();
  const input = messages.flatMap((message) => {
    if (message.role === "system") return [];

    if (message.role !== "assistant") {
      const content = toResponsesContent(message);
      return content.length ? [{ type: "message", role: message.role, content }] : [];
    }

    // UI messages can contain several steps. Grouping all reasoning/text ahead
    // of all tools changes the conversation and breaks stateless continuation.
    return (message.raw.parts ?? []).flatMap((part: any): any[] => {
      if (isReasoningPart(part)) {
        const item = responsesReasoningFromPart(part, providerKey);
        if (!item) return [];
        const previous = item.id ? reasoningById.get(item.id) : undefined;
        if (previous) {
          if (!Array.isArray(responsesPartMetadata(part, providerKey).summary)) previous.summary.push(...item.summary);
          return [];
        }
        if (item.id) reasoningById.set(item.id, item);
        return [item];
      }
      if (isToolPart(part)) return toResponsesToolEntries(part, providerKey);
      const text = part.type === "text" ? getTextFromPart(part) : "";
      const metadata = responsesPartMetadata(part, providerKey);
      return text ? [compactObject({ type: "message", role: "assistant", id: metadata.id ?? metadata.item_id,
        phase: metadata.phase, content: [{ type: "output_text", text }] })] : [];
    });
  });

  return mergeNativeRequestBody(providerRequestConfig, compactObject({
    model: body.model,
    temperature: body.temperature,
    max_output_tokens: body.maxOutputTokens,
    metadata: resolveNativeEndpointMetadata({ providerRequestConfig }),
    instructions: getSystemText(messages),
    tools: activeTools,
    tool_choice: resolveOpenAiToolChoice(body, providerRequestConfig, hasTools),
    store: false,
    input,
    stream: true,
  }));
};
