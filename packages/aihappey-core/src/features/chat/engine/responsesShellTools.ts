// Responses shell calls and their output items have different native IDs. Keep
// the invocation item's ID as the UI identity, as the Gateway API does, and use
// call_id only to correlate native items. All state belongs to one response stream.
type NativeItem = Record<string, any>;
type Controller = ReadableStreamDefaultController<Uint8Array>;
type ShellCall = {
  item: NativeItem;
  commands: Map<number, string>;
  completedCommands: Set<number>;
  streamedInput: string;
  started: boolean;
  inputAvailable: boolean;
};
type ShellOutput = {
  item: NativeItem;
  chunks: Map<number, NativeItem>;
  completed: boolean;
  finalEmitted: boolean;
  lastPreliminary?: string;
};

const identifier = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined;
const indexOf = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : undefined;
const defined = (item: NativeItem) => Object.fromEntries(Object.entries(item).filter(([, value]) => value !== undefined));

export const createResponsesShellToolMapper = ({ emit, startStep, providerKey }: {
  emit: (controller: Controller, chunk: any) => void;
  startStep: (controller: Controller) => void;
  providerKey: () => string;
}) => {
  const calls = new Set<ShellCall>();
  const callsByItem = new Map<string, ShellCall>();
  const callsById = new Map<string, ShellCall>();
  const callsByIndex = new Map<number, ShellCall>();
  const outputs = new Set<ShellOutput>();
  const outputsByItem = new Map<string, ShellOutput>();
  const outputsById = new Map<string, ShellOutput>();
  const outputsByIndex = new Map<number, ShellOutput>();
  const metadata = (value: NativeItem) => ({ [providerKey()]: defined(value) });
  const callMetadata = (call: ShellCall) => metadata({
    type: "shell_call", tool_name: "shell_call", title: "shell_call",
    id: call.item.id, item_id: call.item.id, call_id: call.item.call_id,
    status: call.item.status, action: call.item.action, environment: call.item.environment,
    created_by: call.item.created_by, output_index: call.item.output_index,
  });

  const start = (controller: Controller, call: ShellCall) => {
    if (call.started) return;
    startStep(controller);
    emit(controller, { type: "tool-input-start", toolCallId: call.item.id, toolName: "shell",
      title: "Shell", providerExecuted: true, providerMetadata: callMetadata(call) });
    call.started = true;
  };

  const emitOutput = (controller: Controller, output: ShellOutput) => {
    if (output.finalEmitted) return;
    const call = callsById.get(output.item.call_id);
    if (!call?.inputAvailable) return;
    const chunks = [...output.chunks.entries()].sort(([a], [b]) => a - b).map(([, chunk]) => chunk);
    if (!output.completed && !chunks.length) return;
    const structuredContent = defined({ call_id: output.item.call_id, status: output.item.status,
      max_output_length: output.item.max_output_length, output: chunks });
    const signature = JSON.stringify(structuredContent);
    if (!output.completed && signature === output.lastPreliminary) return;
    const providerMetadata = metadata({ type: "shell_call_output", tool_name: "shell_call", title: "shell_call",
      id: output.item.id, output_item_id: output.item.id, tool_use_id: call.item.id,
      call_id: output.item.call_id, status: output.item.status, created_by: output.item.created_by,
      max_output_length: output.item.max_output_length, output: chunks, output_index: output.item.output_index });
    if (output.completed && output.item.status && output.item.status !== "completed") {
      emit(controller, { type: "tool-output-error", toolCallId: call.item.id, providerExecuted: true,
        errorText: typeof output.item.error?.message === "string" ? output.item.error.message : `Shell output ${output.item.status}.`, providerMetadata });
    } else {
      emit(controller, { type: "tool-output-available", toolCallId: call.item.id, providerExecuted: true,
        preliminary: !output.completed, output: { structuredContent }, providerMetadata });
    }
    if (output.completed) output.finalEmitted = true;
    else output.lastPreliminary = signature;
  };

  const emitInput = (controller: Controller, call: ShellCall) => {
    if (call.inputAvailable) return;
    if (!identifier(call.item.call_id)) throw new Error("Completed Responses shell call is missing its call_id.");
    if (call.item.status && call.item.status !== "completed") throw new Error(`Responses shell call ${call.item.status}.`);
    const nativeCommands = call.item.action?.commands;
    const commands = Array.isArray(nativeCommands) && nativeCommands.length
      ? nativeCommands : [...call.commands.entries()].sort(([a], [b]) => a - b).map(([, text]) => text);
    if (!commands.length || commands.some((command: unknown) => typeof command !== "string")) {
      throw new Error("Completed Responses shell call is missing its commands.");
    }
    const input = { commands };
    // Preserve timeout/environment and native nulls, including when the command
    // text was recovered exclusively from command deltas.
    call.item.action = { ...call.item.action, commands };
    start(controller, call);
    const text = JSON.stringify(input);
    if (text.startsWith(call.streamedInput) && text.length > call.streamedInput.length) {
      emit(controller, { type: "tool-input-delta", toolCallId: call.item.id,
        inputTextDelta: text.slice(call.streamedInput.length) });
    }
    emit(controller, { type: "tool-input-available", toolCallId: call.item.id, toolName: "shell", title: "Shell",
      input, providerExecuted: true, providerMetadata: callMetadata(call) });
    call.inputAvailable = true;
    const output = outputsById.get(call.item.call_id);
    if (output) emitOutput(controller, output);
  };

  const applyChunks = (output: ShellOutput, chunks: any[], commandIndex?: number, replace = false) => {
    if (replace) output.chunks.clear();
    chunks.forEach((chunk, index) => {
      if (!chunk || typeof chunk !== "object" || Array.isArray(chunk)) return;
      output.chunks.set(commandIndex !== undefined && chunks.length === 1 ? commandIndex : index, { ...chunk });
    });
  };

  const handleItem = (controller: Controller, item: NativeItem, outputIndex?: number, completed = false, registerOnly = false) => {
    if (item?.type !== "shell_call" && item?.type !== "shell_call_output") return false;
    const itemId = identifier(item.id), callId = identifier(item.call_id);
    if (!itemId) throw new Error("Responses shell item is missing its native item identifier.");
    if (item.type === "shell_call") {
      // Local shell execution is not owned by this adapter. Never misrepresent
      // a client command as an already executed provider tool.
      if (item.environment?.type === "local") throw new Error("Client-executed Responses shell calls are not supported.");
      const call: ShellCall = callsByItem.get(itemId) ?? (callId ? callsById.get(callId) : undefined)
        ?? { item: {}, commands: new Map(), completedCommands: new Set(), streamedInput: "", started: false, inputAvailable: false };
      if (call.item.id && call.item.id !== itemId) throw new Error("Responses shell call_id refers to conflicting item IDs.");
      if (call.item.call_id && callId && call.item.call_id !== callId) throw new Error("Responses shell item has conflicting call IDs.");
      if (!call.inputAvailable) call.item = { ...call.item, ...defined(item), ...defined({ output_index: outputIndex }) };
      calls.add(call); callsByItem.set(itemId, call);
      if (callId) callsById.set(callId, call);
      if (outputIndex !== undefined) callsByIndex.set(outputIndex, call);
      if (registerOnly) return true;
      start(controller, call);
      if (completed) emitInput(controller, call);
    } else {
      const output: ShellOutput = outputsByItem.get(itemId) ?? (callId ? outputsById.get(callId) : undefined)
        ?? (outputIndex !== undefined ? outputsByIndex.get(outputIndex) : undefined)
        ?? { item: {}, chunks: new Map(), completed: false, finalEmitted: false };
      if (output.item.call_id && callId && output.item.call_id !== callId) throw new Error("Responses shell output has conflicting call IDs.");
      if (output.item.id && output.item.id !== itemId) throw new Error("Responses shell output call_id refers to conflicting item IDs.");
      if (output.finalEmitted) return true;
      output.item = { ...output.item, ...defined(item), ...defined({ output_index: outputIndex }) };
      outputs.add(output); outputsByItem.set(itemId, output);
      if (callId) outputsById.set(callId, output);
      if (outputIndex !== undefined) outputsByIndex.set(outputIndex, output);
      if (Array.isArray(item.output)) applyChunks(output, item.output, undefined, completed);
      if (completed && !Array.isArray(item.output) && !output.chunks.size) {
        throw new Error("Completed Responses shell output is missing its output.");
      }
      output.completed ||= completed;
      emitOutput(controller, output);
    }
    return true;
  };

  const handleEvent = (controller: Controller, event: NativeItem) => {
    const type = event.type;
    if (typeof type !== "string") return false;
    const command = type.startsWith("response.shell_call_command.");
    const result = type.startsWith("response.shell_call_output_content.");
    if (!command && !result) return false;
    const outputIndex = indexOf(event.output_index), commandIndex = indexOf(event.command_index);
    if (commandIndex === undefined) return true;
    if (command) {
      const call = (identifier(event.item_id) ? callsByItem.get(event.item_id) : undefined)
        ?? (outputIndex !== undefined ? callsByIndex.get(outputIndex) : undefined);
      if (!call || call.inputAvailable) return true;
      const previous = call.commands.get(commandIndex) ?? "";
      if (type.endsWith(".added")) {
        if (!call.commands.has(commandIndex)) call.commands.set(commandIndex, typeof event.command === "string" ? event.command : "");
      } else if (type.endsWith(".delta") && typeof event.delta === "string") {
        call.commands.set(commandIndex, previous + event.delta);
      } else if (type.endsWith(".done") && typeof event.command === "string") {
        call.commands.set(commandIndex, event.command);
        call.completedCommands.add(commandIndex);
      } else return true;
      const entries = [...call.commands.entries()].sort(([a], [b]) => a - b);
      const text = JSON.stringify({ commands: entries.map(([, text]) => text) });
      const prefix = text.slice(0, call.completedCommands.has(entries.at(-1)![0]) ? -2 : -3);
      if (prefix.startsWith(call.streamedInput) && prefix.length > call.streamedInput.length) {
        emit(controller, { type: "tool-input-delta", toolCallId: call.item.id,
          inputTextDelta: prefix.slice(call.streamedInput.length) });
        call.streamedInput = prefix;
      }
    } else {
      const itemId = identifier(event.item_id), callId = identifier(event.call_id);
      const output: ShellOutput = (itemId ? outputsByItem.get(itemId) : undefined)
        ?? (callId ? outputsById.get(callId) : undefined)
        ?? (outputIndex !== undefined ? outputsByIndex.get(outputIndex) : undefined)
        ?? { item: {}, chunks: new Map(), completed: false, finalEmitted: false };
      if (output.finalEmitted) return true;
      output.item = { ...output.item, ...defined({ id: itemId, call_id: callId, output_index: outputIndex }) };
      outputs.add(output);
      if (itemId) outputsByItem.set(itemId, output);
      if (callId) outputsById.set(callId, output);
      if (outputIndex !== undefined) outputsByIndex.set(outputIndex, output);
      if (type.endsWith(".delta") && event.delta && typeof event.delta === "object") {
        const chunk = output.chunks.get(commandIndex) ?? { stdout: "", stderr: "" };
        for (const field of ["stdout", "stderr"]) {
          if (typeof event.delta[field] === "string") chunk[field] = (chunk[field] ?? "") + event.delta[field];
        }
        if (event.delta.created_by !== undefined) chunk.created_by = event.delta.created_by;
        output.chunks.set(commandIndex, chunk);
      } else if (type.endsWith(".done") && Array.isArray(event.output)) {
        applyChunks(output, event.output, commandIndex);
      }
      emitOutput(controller, output);
    }
    return true;
  };

  const assertComplete = () => {
    if ([...calls].some(call => !call.inputAvailable || !outputsById.get(call.item.call_id)?.finalEmitted)
      || [...outputs].some(output => !output.finalEmitted)) {
      throw new Error("Responses ended with an incomplete or uncorrelated shell call/output.");
    }
  };
  return { handleItem, handleEvent, assertComplete };
};
