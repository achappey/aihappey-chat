// Match the gateway's hosted tool-search contract: native calls and outputs
// have distinct item IDs, and server searches may legitimately have no call_id.
// Correlation without a call_id is ordered and belongs to this response only.
type NativeItem = Record<string, any>;
type Controller = ReadableStreamDefaultController<Uint8Array>;
type SearchCall = {
  item: NativeItem;
  order: number;
  completed: boolean;
  active: boolean;
  toolCallId?: string;
  inputAvailable: boolean;
  finalEmitted: boolean;
  output?: SearchOutput;
};
type SearchOutput = { item: NativeItem; order: number; completed: boolean; call?: SearchCall };

const identifier = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined;
const defined = (item: NativeItem) => Object.fromEntries(Object.entries(item).filter(([, value]) => value !== undefined));
const failed = (item: NativeItem) => item.error != null || (item.status != null && item.status !== "completed");

/** Replay only a completed native pair from the active provider, never a UI ID. */
export const responsesToolSearchReplay = (part: any, providerKey?: string): any[] => {
  if (!providerKey || part?.state !== "output-available" || part.preliminary === true
    || part.approval?.approved === false || !Array.isArray(part.output)) return [];
  const call = part.callProviderMetadata?.[providerKey];
  const result = part.resultProviderMetadata?.[providerKey];
  if (call?.type !== "tool_search_call" || result?.type !== "tool_search_output"
    || call.execution !== "server" || result.execution !== "server"
    || !identifier(call.id) || !identifier(result.id) || call.id === result.id
    || (call.status && call.status !== "completed") || (result.status && result.status !== "completed")
    || (identifier(call.call_id) ?? null) !== (identifier(result.call_id) ?? null)) return [];
  return [defined({
    type: "tool_search_call", id: call.id, execution: "server", call_id: identifier(call.call_id) ?? null,
    status: "completed", arguments: part.input ?? {}, created_by: call.created_by,
  }), defined({
    type: "tool_search_output", id: result.id, execution: "server", call_id: identifier(result.call_id) ?? null,
    status: "completed", tools: part.output, created_by: result.created_by,
  })];
};

export const createResponsesToolSearchMapper = ({ emit, startStep, providerKey }: {
  emit: (controller: Controller, chunk: any) => void;
  startStep: (controller: Controller) => void;
  providerKey: () => string;
}) => {
  const calls = new Map<string, SearchCall>();
  const outputs = new Map<string, SearchOutput>();
  const callIds = new Map<string, SearchCall>();
  const outputCallIds = new Map<string, SearchOutput>();
  let ordinal = 0;
  const metadata = (item: NativeItem, extra: NativeItem = {}) => ({ [providerKey()]: defined({
    type: item.type, id: item.id, call_id: item.call_id, execution: item.execution,
    status: item.status, tools: item.tools, created_by: item.created_by, output_index: item.output_index,
    ...extra,
  }) });
  const ordered = <T extends { item: NativeItem; order: number }>(entries: Iterable<T>): T[] =>
    [...entries].sort((a, b) => (a.item.output_index ?? a.order) - (b.item.output_index ?? b.order));

  const bind = (call: SearchCall, output: SearchOutput) => {
    if ((call.output && call.output !== output) || (output.call && output.call !== call)) {
      throw new Error("Responses tool search has conflicting call/output identities.");
    }
    call.output = output;
    output.call = call;
  };

  const correlate = () => {
    // Explicit identities always win. Never consume an anonymous search for an
    // unmatched explicit output, or correlate unrelated tools through null.
    for (const output of outputs.values()) {
      const id = identifier(output.item.call_id);
      const call = id ? callIds.get(id) : undefined;
      if (call) bind(call, output);
    }
    const pending = ordered(calls.values()).filter(call => !call.output && !identifier(call.item.call_id));
    for (const output of ordered(outputs.values())) {
      if (output.call || identifier(output.item.call_id)) continue;
      const call = pending.shift();
      if (call) bind(call, output);
    }
  };

  const emitCall = (controller: Controller, call: SearchCall) => {
    if (!call.active || call.finalEmitted) return;
    if (!call.toolCallId) {
      startStep(controller);
      call.toolCallId = identifier(call.item.call_id) ?? call.item.id;
      emit(controller, { type: "tool-input-start", toolCallId: call.toolCallId, toolName: "tool_search",
        title: "tool_search", providerExecuted: true,
        providerMetadata: metadata(call.item, { item_id: call.item.id }) });
    }
    if (!call.completed) return;
    if (!call.inputAvailable) {
      let input = call.item.arguments ?? {};
      if (typeof input === "string") {
        try { input = JSON.parse(input); }
        catch { throw new Error("Responses tool search has invalid JSON arguments."); }
      }
      if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw new Error("Responses tool search arguments must be an object.");
      }
      emit(controller, { type: "tool-input-available", toolCallId: call.toolCallId, toolName: "tool_search",
        title: "tool_search", input, providerExecuted: true,
        providerMetadata: metadata(call.item, { item_id: call.item.id }) });
      call.inputAvailable = true;
    }
    const output = call.output;
    if (!output?.completed) return;
    const isError = failed(call.item) || failed(output.item);
    if (!isError && !Array.isArray(output.item.tools)) {
      throw new Error("Completed Responses tool search output is missing its tools array.");
    }
    const providerMetadata = metadata(output.item, { output_item_id: output.item.id, tool_use_id: call.toolCallId });
    const error = output.item.error ?? call.item.error;
    emit(controller, isError ? {
      type: "tool-output-error", toolCallId: call.toolCallId, providerExecuted: true, providerMetadata,
      errorText: typeof error === "string" ? error : typeof error?.message === "string" ? error.message
        : `Responses tool search ${output.item.status ?? call.item.status ?? "failed"}.`,
    } : {
      type: "tool-output-available", toolCallId: call.toolCallId, providerExecuted: true, providerMetadata,
      // The gateway exposes the native descriptor array, not the transport item
      // or a projection to local MCP tools. Preserve namespaces and future fields.
      output: output.item.tools,
    });
    call.finalEmitted = true;
  };

  const handleItem = (controller: Controller, item: NativeItem, outputIndex?: number, completed = false, registerOnly = false) => {
    if (item?.type !== "tool_search_call" && item?.type !== "tool_search_output") return false;
    if (item.execution != null && item.execution !== "server") {
      throw new Error(`Client-executed or unknown Responses tool search execution ${item.execution} is not supported.`);
    }
    const id = identifier(item.id), callId = identifier(item.call_id);
    if (!id) throw new Error("Responses tool search item is missing its native identifier.");
    if (item.call_id != null && typeof item.call_id !== "string") throw new Error("Responses tool search has an invalid call_id.");
    const isCall = item.type === "tool_search_call";
    if ((isCall ? outputs : calls).has(id)) throw new Error("Responses tool search reuses a native call/output item identifier.");
    const previous = isCall ? calls.get(id) : outputs.get(id);
    if (previous && identifier(previous.item.call_id) !== callId && item.call_id !== undefined) {
      throw new Error("Responses tool search item has conflicting call IDs.");
    }
    const nextItem = defined({ ...item, execution: "server", output_index: outputIndex });
    if (isCall) {
      const call = calls.get(id) ?? { item: {}, order: ordinal++, completed: false, active: false, inputAvailable: false, finalEmitted: false };
      if (!call.completed) call.item = { ...call.item, ...nextItem };
      call.completed ||= completed;
      call.active ||= !registerOnly;
      calls.set(id, call);
      if (callId) {
        if (callIds.has(callId) && callIds.get(callId) !== call) throw new Error("Responses tool search call_id refers to conflicting native calls.");
        callIds.set(callId, call);
      }
    } else {
      const output = outputs.get(id) ?? { item: {}, order: ordinal++, completed: false };
      if (!output.completed) output.item = { ...output.item, ...nextItem };
      output.completed ||= completed;
      outputs.set(id, output);
      if (callId) {
        if (outputCallIds.has(callId) && outputCallIds.get(callId) !== output) throw new Error("Responses tool search call_id refers to conflicting native outputs.");
        outputCallIds.set(callId, output);
      }
    }
    if (!registerOnly) {
      correlate();
      for (const call of ordered(calls.values())) emitCall(controller, call);
    }
    return true;
  };

  const assertComplete = () => {
    if ([...calls.values()].some(call => !call.finalEmitted) || [...outputs.values()].some(output => !output.call?.finalEmitted)) {
      throw new Error("Responses ended with an incomplete or uncorrelated hosted tool search call/output.");
    }
  };
  return { handleItem, assertComplete };
};
