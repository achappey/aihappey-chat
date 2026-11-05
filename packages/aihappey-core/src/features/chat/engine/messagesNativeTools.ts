import { asRecord, nonEmptyString } from "./genericEndpointMappers/toolParts";

// Keep this list aligned with MessagesUnifiedMapper.Shared.IsToolOutputBlock.
export const MESSAGES_PROVIDER_RESULTS: Record<string, string> = {
  web_search_tool_result: "web_search",
  web_fetch_tool_result: "web_fetch",
  code_execution_tool_result: "code_execution",
  bash_code_execution_tool_result: "bash_code_execution",
  text_editor_code_execution_tool_result: "text_editor_code_execution",
  tool_search_tool_result: "tool_search_tool_regex",
  mcp_tool_result: "mcp",
};

export const isMessagesProviderResult = (block: any) =>
  Object.hasOwn(MESSAGES_PROVIDER_RESULTS, String(block?.type ?? ""));

export const isMessagesProviderCall = (block: any) =>
  block?.type === "server_tool_use" || block?.type === "mcp_tool_use";

export const isMessagesToolCall = (block: any) => block?.type === "tool_use" || isMessagesProviderCall(block);

// These are the gateway's existing callProviderMetadata/resultProviderMetadata
// channels. Native content is retained too: errorText alone cannot replay a typed
// server-tool failure, and merging the channels would overwrite the call type.
export const messagesBlockMetadata = (block: any, blockIndex?: number, messageId?: string) => {
  const { input: _input, text: _text, thinking: _thinking, ...metadata } = block;
  return {
    ...metadata,
    ...(blockIndex !== undefined ? { block_index: blockIndex } : {}),
    ...(messageId ? { message_id: messageId } : {}),
  };
};

export const messagesToolOutput = (block: any) => {
  const output = block.type === "web_search_tool_result"
    ? { structuredContent: { content: block.content } } : block.content;
  // Match VercelUnifiedMapper.WrapToolOutputForUi, not just the intermediate
  // Unified payload. The activity UI consumes CallToolResult-shaped output.
  if (typeof output === "string") return { content: [{ type: "text", text: output }] };
  if (asRecord(output) && ["structuredContent", "content", "isError", "meta"].some(key => Object.hasOwn(output, key))) return output;
  return { content: [], structuredContent: output ?? {} };
};

export const messagesToolError = (block: any): string | undefined => {
  const content = asRecord(block?.content);
  if (block?.is_error !== true && !String(content?.type ?? "").endsWith("_error")) return undefined;
  return nonEmptyString(content?.error_code) ?? nonEmptyString(content?.message)
    ?? nonEmptyString(block.content) ?? "Provider tool execution failed.";
};

const withType = (value: any, type: string) => asRecord(value) && !nonEmptyString(value.type)
  ? { ...value, type } : value;

// Gateway UI output can be wrapped in structuredContent (web search) or output.
// Unwrap only known wrappers; native typed objects must never lose their content.
const providerPayload = (output: any) => {
  let payload = output;
  for (let i = 0; i < 8 && asRecord(payload) && !payload.type; i++) {
    if (payload.structuredContent !== undefined && payload.structuredContent !== null) payload = payload.structuredContent;
    else if (Object.hasOwn(payload, "output")) payload = payload.output;
    else break;
  }
  return payload;
};

const normalizeResultContent = (type: string, output: any) => {
  let payload = providerPayload(output);
  if (["web_search_tool_result", "mcp_tool_result"].includes(type)
    && asRecord(payload) && !payload.type && Object.hasOwn(payload, "content")) payload = payload.content;
  if (type === "web_search_tool_result") return Array.isArray(payload)
    ? payload.map(item => withType(item, "web_search_result")) : payload;
  if (!asRecord(payload)) return payload;
  const error = Object.hasOwn(payload, "error_code");
  let successType: string | undefined;
  let itemType: string | undefined;
  let property = "content";
  switch (type) {
    case "web_fetch_tool_result": successType = "web_fetch_result"; break;
    case "code_execution_tool_result":
      successType = Object.hasOwn(payload, "encrypted_stdout") ? "encrypted_code_execution_result" : "code_execution_result";
      itemType = "code_execution_output";
      break;
    case "bash_code_execution_tool_result": successType = "bash_code_execution_result"; itemType = "bash_code_execution_output"; break;
    case "tool_search_tool_result": successType = "tool_search_tool_search_result"; itemType = "tool_reference"; property = "tool_references"; break;
    case "text_editor_code_execution_tool_result":
      successType = Object.hasOwn(payload, "file_type") ? "text_editor_code_execution_view_result"
        : Object.hasOwn(payload, "is_file_update") ? "text_editor_code_execution_create_result"
        : ["lines", "new_lines", "new_start", "old_lines", "old_start"].some(key => Object.hasOwn(payload, key))
          ? "text_editor_code_execution_str_replace_result" : undefined;
      break;
  }
  if (error) payload = withType(payload, `${type}_error`);
  else if (successType) payload = withType(payload, successType);
  if (itemType && Array.isArray(payload[property])) {
    payload = { ...payload, [property]: payload[property].map((item: any) => withType(item, itemType!)) };
  }
  return payload;
};

export type MessagesReplayBlock = { block: any; metadata?: Record<string, any> };

export const messagesProviderReplay = (part: any, providerKey?: string): MessagesReplayBlock[] => {
  if (!providerKey || part.providerExecuted !== true || part.preliminary === true
    || !["output-available", "output-error"].includes(part.state)) return [];
  const legacy = asRecord(part.providerMetadata?.[providerKey]);
  const call = asRecord(part.callProviderMetadata?.[providerKey])
    ?? (isMessagesProviderCall(legacy) ? legacy : undefined);
  const result = asRecord(part.resultProviderMetadata?.[providerKey])
    ?? (isMessagesProviderResult(legacy) ? legacy : undefined);
  if (!result || !isMessagesProviderResult(result)) return [];
  const id = nonEmptyString(call?.id ?? result.tool_use_id ?? part.toolCallId);
  if (!id || (result.tool_use_id && result.tool_use_id !== id)) return [];
  // Result-only gateway parts remain result-only. Do not invent an invocation.
  if (call && (!isMessagesProviderCall(call) || !nonEmptyString(call.name ?? part.toolName))) return [];
  const content = Object.hasOwn(result, "content") ? result.content : normalizeResultContent(result.type, part.output);
  if (content === undefined || content === null) return [];
  const blocks: MessagesReplayBlock[] = [];
  if (call) {
    const input = part.input ?? {};
    if (!asRecord(input)) return [];
    blocks.push({ block: {
      type: call.type, id, name: call.name ?? part.toolName ?? String(part.type).replace(/^tool-/, ""), input,
      ...(call.caller ? { caller: call.caller } : {}),
      ...(call.server_name ? { server_name: call.server_name } : {}),
    }, metadata: call });
  }
  blocks.push({ block: {
    type: result.type, tool_use_id: id, content,
    ...(result.type === "mcp_tool_result" && (result.is_error === true || part.state === "output-error") ? { is_error: true } : {}),
    ...(result.caller ? { caller: result.caller } : {}),
  }, metadata: result });
  return blocks;
};

// Tool results update the original UI tool part in-place. Restore their native
// positions among text/reasoning blocks when both channels have block indices.
// Gateway history without indices keeps its existing part order.
export const orderMessagesReplayBlocks = (entries: MessagesReplayBlock[]): any[] => {
  const ordered: MessagesReplayBlock[] = [];
  let run: MessagesReplayBlock[] = [];
  const flush = () => {
    run.sort((a, b) => a.metadata!.block_index - b.metadata!.block_index);
    ordered.push(...run);
    run = [];
  };
  for (const entry of entries) {
    if (!Number.isInteger(entry.metadata?.block_index) || !entry.metadata?.message_id) {
      flush();
      ordered.push(entry);
    } else {
      if (run.length && run[0].metadata!.message_id !== entry.metadata.message_id) flush();
      run.push(entry);
    }
  }
  flush();
  return ordered.map(entry => entry.block);
};
