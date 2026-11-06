import {
  ANTHROPIC_THINKING_METADATA_TYPES,
  compactObject,
  getProviderKeyFromRequestBody,
  hasConfiguredNativeTools,
  mapAnthropicMessagesTools,
  mergeNativeTools,
  resolveNativeEndpointMetadata,
  mergeNativeRequestBody,
  resolveAnthropicToolChoice,
  sanitizeGenericEndpointProviderRequestConfig,
  type GenericChatEndpointRequestBody,
  type GenericMappedFilePart,
  type GenericMappedMessage,
} from "./types";
import {
  hasToolPartOutput,
  isClientExecutableToolPart,
  isOutputOnlyToolPart,
  stringifyToolValue,
  toolPartCallId,
  toolPartInput,
  toolPartName,
  toolPartOutput,
} from "./toolParts";
import { getSystemText, getTextFromPart, isReasoningPart, isToolPart, mapUiMessages, parseDataUrl } from "./uiMessageParts";
import {
  CLIENT_TOOL_SEARCH_NAME,
  selectedToolsFromClientToolSearchResult,
} from "../../../tools/clientToolSearch";
import { messagesProviderReplay, orderMessagesReplayBlocks, type MessagesReplayBlock } from "../messagesNativeTools";

const toAnthropicFileBlocks = (file: GenericMappedFilePart) => {
  if (file.mimeType.startsWith("image/") && file.dataUrl) {
    const parsed = parseDataUrl(file.dataUrl);
    if (!parsed) return [];
    return [{
      type: "image",
      source: {
        type: "base64",
        media_type: parsed.mimeType,
        data: parsed.base64,
      },
    }];
  }

  if (file.mimeType === "application/pdf" && file.base64) {
    return [{
      type: "document",
      source: {
        type: "base64",
        media_type: "application/pdf",
        data: file.base64,
      },
      title: file.filename,
    }];
  }

  const text = typeof file.raw?.textContent === "string" ? file.raw.textContent : undefined;
  if (file.mimeType.startsWith("text/") && text) {
    return [{
      type: "document",
      source: {
        type: "text",
        media_type: "text/plain",
        data: text,
      },
      title: file.filename,
    }];
  }

  return [];
};

const messagesReasoningFromPart = (part: any, providerKey?: string) => {
  if (!providerKey) return undefined;

  const providerMetadata = part?.providerMetadata?.[providerKey];
  if (!providerMetadata || typeof providerMetadata !== "object") return undefined;

  const metadataType = providerMetadata.type;
  const redactedData = providerMetadata.data ?? providerMetadata.encrypted_content;
  if ((metadataType === ANTHROPIC_THINKING_METADATA_TYPES.redactedThinking
    || (providerKey === "anthropic" && !providerMetadata.signature)) && typeof redactedData === "string" && redactedData) {
    return {
      type: "redacted_thinking" as const,
      data: redactedData,
    };
  }

  const signature = providerMetadata.signature;
  if (typeof signature !== "string" || !signature) return undefined;

  return {
    type: "thinking" as const,
    thinking: getTextFromPart(part),
    signature,
  };
};

const toAnthropicContentBlocks = (message: GenericMappedMessage) => {
  const blocks: any[] = [];
  if (message.text) blocks.push({ type: "text", text: message.text });

  if (message.role === "user") {
    blocks.push(...message.fileParts.flatMap(toAnthropicFileBlocks));
  }

  return blocks;
};

const toAnthropicToolResult = (part: any, toolUseId: string) => {
  const denied = part.state === "output-denied" || part.approval?.approved === false;
  const failed = part.state === "output-error";
  if (!hasToolPartOutput(part) && part.state !== "output-available" && !denied && !failed) return undefined;
  const output = denied ? (part.approval?.reason || "The user denied this tool request.")
    : failed ? (part.errorText ?? toolPartOutput(part) ?? "Tool execution failed.") : toolPartOutput(part);
  const isError = denied || failed || output?.isError === true;
  const selectedTools = !isError && toolPartName(part) === CLIENT_TOOL_SEARCH_NAME
    ? selectedToolsFromClientToolSearchResult(output) : undefined;
  return compactObject({
    type: "tool_result",
    tool_use_id: toolUseId,
    content: selectedTools ? selectedTools.map((tool: any) => ({ type: "tool_reference", tool_name: tool.name }))
      : stringifyToolValue(output),
    is_error: isError ? true : undefined,
  });
};

const toAnthropicMessages = (messages: GenericMappedMessage[], providerKey?: string): any[] => messages
  .filter((message) => message.role !== "system")
  .flatMap((message): any[] => {
    if (message.role !== "assistant") {
      const content = toAnthropicContentBlocks(message);
      return content.length > 0
        ? [compactObject({ role: message.role as "user", content })]
        : [];
    }

    const result: any[] = [];
    let content: MessagesReplayBlock[] = [];
    let toolResults: any[] = [];
    const seenCalls = new Set<string>();
    const seenResults = new Set<string>();
    const parts = (message.raw.parts ?? []) as any[];
    const hasSteps = parts.some(part => part.type === "step-start");
    const flush = () => {
      if (content.length) result.push({ role: "assistant", content: orderMessagesReplayBlocks(content) });
      if (toolResults.length) result.push({ role: "user", content: toolResults });
      content = [];
      toolResults = [];
    };
    for (const part of parts) {
      if (part.type === "step-start") {
        flush();
      } else if (isToolPart(part)) {
        if (part.providerExecuted === true) {
          const blocks = messagesProviderReplay(part, providerKey).filter(({ block }) => {
            const calls = block.tool_use_id ? seenResults : seenCalls;
            const id = block.tool_use_id ?? block.id;
            if (calls.has(id)) return false;
            calls.add(id);
            return true;
          });
          if (blocks.length) {
            if (!hasSteps && toolResults.length) flush();
            content.push(...blocks);
          }
          continue;
        }
        if (!isClientExecutableToolPart(part)
          || ["input-streaming", "input-error", "approval-requested"].includes(part.state)) continue;
        const id = toolPartCallId(part);
        if (!id) continue;
        const output = toAnthropicToolResult(part, id);
        // Never send dangling calls (for example after cancellation) as history.
        if (!output) continue;
        if (!isOutputOnlyToolPart(part) && !seenCalls.has(id)) {
          const metadata = providerKey ? part.callProviderMetadata?.[providerKey] ?? part.providerMetadata?.[providerKey] : undefined;
          // Messages requires input even for parameterless tools ({}), just as
          // the gateway does. Compact only optional metadata, not required input.
          content.push({ block: {
            type: "tool_use", id, name: toolPartName(part), input: toolPartInput(part),
            ...compactObject({ caller: metadata?.caller }),
          }, metadata });
          seenCalls.add(id);
        }
        if (seenCalls.has(id) && !seenResults.has(id)) {
          toolResults.push(output);
          seenResults.add(id);
        }
      } else if (isReasoningPart(part)) {
        const block = messagesReasoningFromPart(part, providerKey);
        if (!block) continue;
        if (!hasSteps && toolResults.length) flush();
        content.push({ block, metadata: providerKey ? part.providerMetadata?.[providerKey] : undefined });
      } else if (part.type === "text" && getTextFromPart(part)) {
        if (!hasSteps && toolResults.length) flush();
        const metadata = providerKey ? part.providerMetadata?.[providerKey] : undefined;
        content.push({ block: compactObject({ type: "text", text: getTextFromPart(part),
          citations: metadata?.type === "text" ? metadata.citations : undefined }), metadata });
      }
    }
    flush();
    return result;
  });

export const buildMessagesBody = (body: GenericChatEndpointRequestBody) => {
  const messages = mapUiMessages(body.messages);
  // A provider need not have any request settings. Its identity still comes
  // from the selected route (or canonical gateway model), not an arbitrary
  // first key in a possibly empty metadata map.
  const providerKey = String(body.providerRequestConfigProviderKey ?? "").trim().toLowerCase()
    || (body.model?.includes("/") ? body.model.split("/")[0].trim().toLowerCase() : undefined)
    || getProviderKeyFromRequestBody(body);
  const providerRequestConfig = sanitizeGenericEndpointProviderRequestConfig({
    ...body,
    endpoint: "/v1/messages",
  });
  const activeTools = hasConfiguredNativeTools(providerRequestConfig)
    ? mergeNativeTools(providerRequestConfig?.tools, mapAnthropicMessagesTools(body))
    : mapAnthropicMessagesTools(body);
  const hasTools = Boolean(activeTools?.length);

  return mergeNativeRequestBody(providerRequestConfig, compactObject({
    model: body.model,
    system: getSystemText(messages),
    temperature: body.temperature,
    max_tokens: body.maxOutputTokens ?? providerRequestConfig?.max_tokens ?? 1024,
    metadata: resolveNativeEndpointMetadata({
      providerRequestConfig,
      extraMetadata: compactObject({
        user_id: body.metadata?.user_id,
      }),
    }),
    messages: toAnthropicMessages(messages, providerKey),
    tools: activeTools,
    tool_choice: resolveAnthropicToolChoice(body, providerRequestConfig, hasTools),
    stream: true,
  }));
};
