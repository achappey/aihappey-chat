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
  resolveNativeRequestMetadata,
  resolveOpenAiToolChoice,
  sanitizeGenericEndpointProviderRequestConfig,
  type GenericChatEndpointRequestBody,
  type GenericMappedMessage,
} from "./types";
import { getSystemText, getTextFromPart, mapUiMessages, toInlineFileData } from "./uiMessageParts";

const responsesReasoningFromPart = (part: any, providerKey?: string) => {
  if (!providerKey) return undefined;

  const encryptedContent = part?.providerMetadata?.[providerKey]?.encrypted_content;
  if (typeof encryptedContent !== "string" || !encryptedContent) return undefined;

  const summaryText = getTextFromPart(part);
  return {
    ...compactObject({
      type: "reasoning" as const,
      id: part?.id,
      encrypted_content: encryptedContent,
    }),
    summary: summaryText ? [{ type: "summary_text" as const, text: summaryText }] : [],
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
    const configured = requestConfig[name] ?? {};
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

  if (!body.useToolNamespaces) {
    return functions.map(({ source: _source, ...tool }) => tool);
  }

  const groups = new Map<string, { name: string; description?: string; tools: Array<Record<string, any>> }>();
  for (const { source, ...tool } of functions) {
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
  return [...groups.values()].map((group) => {
    let name = names.get(group.name) ?? sanitizeNamespaceName(group.name);
    let suffix = 2;
    const base = name;
    while (claimedNames.has(name)) name = `${base.slice(0, 60)}_${suffix++}`;
    claimedNames.add(name);
    return { type: "namespace" as const, name, description: group.description, tools: group.tools };
  });
};

const toResponsesToolEntries = (message: GenericMappedMessage) => message.toolParts.flatMap((part: any) => {
  if (part?.providerExecuted === true) return [];

  const callId = String(part?.toolCallId ?? part?.id ?? part?.call_id ?? "").trim();
  if (!callId) return [];

  const entries: any[] = [];
  const toolName = toolPartName(part);
  const providerMetadata = part?.callProviderMetadata?.openai
    ?? part?.providerMetadata?.openai
    ?? part?.resultProviderMetadata?.openai;
  const isClientToolSearch = toolName === OPENAI_CLIENT_TOOL_SEARCH_NAME
    && (providerMetadata?.type === "tool_search_call" || providerMetadata?.execution === "client");

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
      call_id: callId,
      name: toolName,
      namespace: part?.namespace ?? part?.providerMetadata?.openai?.namespace,
      arguments: stringifyToolValue(toolPartInput(part)),
      caller: part?.caller ?? part?.providerMetadata?.openai?.caller,
    }));
  }

  const output = toolPartOutput(part);
  if (output !== undefined) {
    entries.push({
      type: "function_call_output" as const,
      call_id: callId,
      output: stringifyToolValue(output),
      caller: part?.caller ?? part?.providerMetadata?.openai?.caller,
    });
  }

  return entries;
});

export const buildResponsesBody = (body: GenericChatEndpointRequestBody) => {
  const messages = mapUiMessages(body.messages);
  const providerKey = getProviderKeyFromRequestBody(body);
  const providerRequestConfig = sanitizeGenericEndpointProviderRequestConfig({
    ...body,
    endpoint: "/v1/responses",
  });
  const mappedTools = mapConfiguredOpenAiResponseTools(body);
  const activeTools = hasConfiguredNativeTools(providerRequestConfig)
    ? mergeNativeTools(providerRequestConfig?.tools, mappedTools)
    : mappedTools;
  const hasTools = Boolean(activeTools?.length);
  const input = messages.flatMap((message) => {
    if (message.role === "system") return [];

    const reasoningItems = message.role === "assistant"
      ? message.reasoningParts
        .map((part) => responsesReasoningFromPart(part, providerKey))
        .filter(Boolean)
      : [];

    const messageItem = compactObject({
      type: "message" as const,
      role: message.role as "user" | "assistant",
      content: toResponsesContent(message),
    });
    const toolItems = message.role === "assistant" ? toResponsesToolEntries(message) : [];

    return [
      ...reasoningItems,
      ...(Array.isArray(messageItem.content) && messageItem.content.length > 0 ? [messageItem] : []),
      ...toolItems,
    ];
  });

  return compactObject({
    ...(providerRequestConfig ?? {}),
    model: body.model,
    temperature: body.temperature,
    max_output_tokens: body.maxOutputTokens,
    metadata: resolveNativeRequestMetadata(body),
    instructions: getSystemText(messages),
    tools: activeTools,
    tool_choice: resolveOpenAiToolChoice(body, providerRequestConfig, hasTools),
    store: false,
    input,
    stream: true,
  });
};
