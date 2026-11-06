type NativeItem = Record<string, any>;
type Controller = ReadableStreamDefaultController<Uint8Array>;
type Entry = { item: NativeItem; completed: boolean; active: boolean; started: boolean; input: boolean; output: boolean };
const identifier = (value: unknown): value is string => typeof value === "string" && !!value.trim();
const defined = (item: NativeItem): NativeItem => Object.fromEntries(Object.entries(item).filter(([, value]) => value !== undefined));

/** Program execution is hosted. Persist its opaque replay state, never execute its code locally. */
export const responsesProgramReplay = (part: any, providerKey?: string): any[] => {
  if (!providerKey || part?.providerExecuted !== true || part.preliminary === true
    || part.approval?.approved === false || ["input-streaming", "input-error"].includes(part.state)) return [];
  const call = part.callProviderMetadata?.[providerKey];
  const result = part.resultProviderMetadata?.[providerKey];
  const items: any[] = [];
  if (call?.type === "program" && identifier(call.id) && identifier(call.call_id)
    && typeof part.input?.code === "string" && identifier(call.fingerprint)) {
    items.push(defined({ type: "program", id: call.id, call_id: call.call_id,
      code: part.input.code, fingerprint: call.fingerprint }));
  }
  if (result?.type === "program_output" && identifier(result.id) && identifier(result.call_id)
    && (!call || call.type === "program_output" || call.call_id === result.call_id)
    && ["completed", "incomplete"].includes(result.status)) {
    const value = part.output?.result ?? result.result;
    if (typeof value === "string") items.push({ type: "program_output", id: result.id,
      call_id: result.call_id, result: value, status: result.status });
  }
  return items;
};

/** A merged UI tool card must not pull its native result ahead of intervening output items. */
export const orderResponsesProgramReplay = (entries: Array<{ item: any; index?: number }>): any[] => {
  if (!entries.some(({ item }) => item.type === "program" || item.type === "program_output")) return entries.map(entry => entry.item);
  const native = entries.filter(({ item }) => item.type !== "function_call_output" && item.type !== "apply_patch_call_output");
  const outputs = entries.filter(({ item }) => item.type === "function_call_output" || item.type === "apply_patch_call_output");
  // Indices are response-local. The caller applies this separately to each SDK step.
  native.sort((a, b) => (a.index ?? Number.MAX_SAFE_INTEGER) - (b.index ?? Number.MAX_SAFE_INTEGER));
  return [...native, ...outputs].map(entry => entry.item);
};

export const createResponsesProgramMapper = ({ emit, startStep, providerKey }: {
  emit: (controller: Controller, chunk: any) => void;
  startStep: (controller: Controller) => void;
  providerKey: () => string;
}) => {
  const calls = new Map<string, Entry>();
  const results = new Map<string, Entry>();
  const ids = new Map<string, string>();
  const metadata = (item: NativeItem, extra: NativeItem = {}) => ({ [providerKey()]: defined({
    type: item.type, id: item.id, call_id: item.call_id, fingerprint: item.fingerprint,
    status: item.status, output_index: item.output_index, ...extra,
  }) });

  const emitResult = (controller: Controller, entry: Entry, toolCallId: string) => {
    if (!entry.completed || entry.output) return;
    const item = entry.item;
    if (typeof item.result !== "string" || !["completed", "incomplete"].includes(item.status)) {
      throw new Error("Responses program output is missing its result or has an invalid status.");
    }
    const failed = item.status === "incomplete";
    emit(controller, failed ? {
      type: "tool-output-error", toolCallId, providerExecuted: true,
      errorText: "Responses program execution was incomplete.",
      providerMetadata: metadata(item, { result: item.result }),
    } : {
      type: "tool-output-available", toolCallId, providerExecuted: true,
      output: { result: item.result, status: item.status }, providerMetadata: metadata(item),
    });
    entry.output = true;
  };

  const emitCall = (controller: Controller, entry: Entry) => {
    if (!entry.active) return;
    const item = entry.item;
    if (!entry.started) {
      startStep(controller);
      emit(controller, { type: "tool-input-start", toolCallId: item.call_id, toolName: "program",
        title: "program", providerExecuted: true, providerMetadata: metadata(item) });
      entry.started = true;
    }
    if (!entry.completed) return;
    if (typeof item.code !== "string" || !identifier(item.fingerprint)) {
      throw new Error("Completed Responses program is missing its code or replay fingerprint.");
    }
    if (!entry.input) {
      emit(controller, { type: "tool-input-available", toolCallId: item.call_id, toolName: "program",
        title: "program", input: { code: item.code }, providerExecuted: true, providerMetadata: metadata(item) });
      entry.input = true;
    }
    const result = results.get(item.call_id);
    if (result) emitResult(controller, result, item.call_id);
  };

  const handleItem = (controller: Controller, item: NativeItem, outputIndex?: number, completed = false, registerOnly = false) => {
    if (item?.type !== "program" && item?.type !== "program_output") return false;
    if (!identifier(item.id) || !identifier(item.call_id)) throw new Error("Responses program item is missing its native id or call_id.");
    const key = `${item.type}:${item.call_id}`;
    if (ids.has(item.id) && ids.get(item.id) !== key) throw new Error("Responses program has conflicting native identifiers.");
    ids.set(item.id, key);
    const entries = item.type === "program" ? calls : results;
    const entry = entries.get(item.call_id) ?? { item: {}, completed: false, active: false, started: false, input: false, output: false };
    if (entry.item.id && entry.item.id !== item.id) throw new Error("Responses program call_id refers to conflicting native items.");
    if (!entry.completed) entry.item = { ...entry.item, ...defined({ ...item, output_index: outputIndex }) };
    entry.completed ||= completed;
    entry.active ||= !registerOnly;
    entries.set(item.call_id, entry);
    if (!registerOnly) {
      const call = calls.get(item.call_id);
      if (call) emitCall(controller, call);
    }
    return true;
  };

  const complete = (controller: Controller) => {
    for (const call of calls.values()) {
      emitCall(controller, call);
      if (!call.completed || !call.input) throw new Error("Responses ended with an unfinished program item.");
      // No result is valid here: the hosted runtime may be paused for client tools.
    }
    for (const [callId, result] of results) {
      if (!result.completed) throw new Error("Responses ended with an unfinished program output.");
      if (!calls.has(callId)) {
        // The program may have started in an earlier response. Represent its
        // result independently; do not invent/re-execute the original program.
        startStep(controller);
        emit(controller, { type: "tool-input-available", toolCallId: result.item.id, toolName: "program_output",
          title: "program", input: {}, providerExecuted: true, providerMetadata: metadata(result.item) });
        emitResult(controller, result, result.item.id);
      }
      if (result.item.status !== "completed") throw new Error("Responses program execution was incomplete.");
    }
  };
  return { handleItem, complete, hasItems: () => calls.size > 0 || results.size > 0 };
};
