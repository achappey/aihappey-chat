import type { RealtimeToolDecision, RealtimeToolReview } from './useRealtimeToolApprovals';

/** Execute -> retain full result -> use the shared review UI -> submit result/denial.
 * Output that already arrived from the backend is reviewed, never executed again.
 */
export async function completeLiveToolCalls(args: {
  chat: { messages: any[]; addToolOutput: (value: any) => void | PromiseLike<void>; addToolApprovalResponse: (value: any) => void | PromiseLike<void> };
  executed: Map<string, unknown>; signal: AbortSignal;
  execute: (item: any, signal: AbortSignal) => Promise<unknown>;
  review: (tool: RealtimeToolReview, signal: AbortSignal) => Promise<RealtimeToolDecision>;
}) {
  const { chat, signal } = args;
  const message = chat.messages.at(-1);
  const pending = (message?.parts ?? []).filter((part: any) => (part.type?.startsWith('tool-') || part.type === 'dynamic-tool') && ['input-available', 'approval-requested'].includes(part.state));
  for (const part of pending) {
    signal.throwIfAborted();
    const toolName = part.toolName ?? part.type.slice(5);
    const key = JSON.stringify([message.id, part.toolCallId]);
    let output = part.output;
    if (!Object.hasOwn(part, 'output') || output === undefined) {
      if (part.providerExecuted) throw new Error(`Provider tool '${toolName}' has no result to review.`);
      if (!args.executed.has(key)) {
        const result = await args.execute({ type: 'function_call', call_id: part.toolCallId, name: toolName, arguments: JSON.stringify(part.input) }, signal);
        args.executed.set(key, result);
      }
      output = args.executed.get(key);
    }
    signal.throwIfAborted();
    // Preserve the pending approval when attaching output. SDK addToolOutput would
    // otherwise erase an unresponded approval, making continuation lose its decision.
    chat.messages = chat.messages.map(value => value.id !== message.id ? value : { ...value,
      parts: value.parts.map((candidate: any) => candidate.toolCallId === part.toolCallId ? { ...candidate, output } : candidate),
    });
    const decision = await args.review({ toolCallId: part.toolCallId, toolName, input: part.input, output }, signal);
    signal.throwIfAborted();
    const released = decision.approved ? output : { isError: true, content: [{ type: 'text', text: decision.reason ?? 'Tool result was not approved.' }] };
    if (part.state === 'approval-requested' && part.approval?.id) {
      if (!decision.approved) chat.messages = chat.messages.map(value => value.id !== message.id ? value : { ...value,
        parts: value.parts.map((candidate: any) => candidate.toolCallId === part.toolCallId ? { ...candidate, output: released } : candidate),
      });
      await chat.addToolApprovalResponse({ id: part.approval.id, ...decision });
    } else {
      await chat.addToolOutput({ tool: toolName, toolCallId: part.toolCallId,
        output: released,
      });
    }
  }
  return pending.length > 0;
}
