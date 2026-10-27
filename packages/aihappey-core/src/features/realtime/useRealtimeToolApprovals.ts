import { useCallback, useEffect, useRef, useState } from 'react';
import type { UIMessage } from 'aihappey-types';

export type RealtimeToolReview = { toolCallId: string; toolName: string; input: unknown; output?: unknown };
export type RealtimeToolDecision = { approved: boolean; reason?: string };
type Pending = { id: string; message: UIMessage; settle: (decision?: RealtimeToolDecision) => void };

/** A session-owned queue feeding the ordinary ToolApprovalModalHost, not a new approval UI. */
export function useRealtimeToolApprovals() {
  const pending = useRef<Pending[]>([]);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const notify = useCallback(() => setMessages(pending.current[0] ? [pending.current[0].message] : []), []);
  const review = useCallback((tool: RealtimeToolReview, signal: AbortSignal) => {
    signal.throwIfAborted();
    return new Promise<RealtimeToolDecision>((resolve, reject) => {
      const id = crypto.randomUUID();
      const output = tool.output == null || typeof tool.output !== 'object'
        ? { content: [{ type: 'text', text: String(tool.output ?? '') }] } : tool.output;
      const abort = () => settle();
      const settle = (decision?: RealtimeToolDecision) => {
        signal.removeEventListener('abort', abort);
        pending.current = pending.current.filter(entry => entry.id !== id);
        notify();
        if (decision) resolve(decision); else reject(new DOMException('Tool review cancelled.', 'AbortError'));
      };
      pending.current.push({ id, settle, message: { id, role: 'assistant', parts: [{
        type: `tool-${tool.toolName}`, toolCallId: tool.toolCallId, input: tool.input,
        ...(tool.output !== undefined ? { output } : {}), state: 'approval-requested', approval: { id },
      }] } });
      signal.addEventListener('abort', abort, { once: true }); notify();
    });
  }, [notify]);
  const respond = useCallback(({ id, ...decision }: RealtimeToolDecision & { id: string }) => {
    pending.current.find(entry => entry.id === id)?.settle(decision);
  }, []);
  const cancel = useCallback(() => { for (const entry of [...pending.current]) entry.settle(); }, []);
  useEffect(() => cancel, [cancel]);
  return { messages, review, respond, cancel };
}
