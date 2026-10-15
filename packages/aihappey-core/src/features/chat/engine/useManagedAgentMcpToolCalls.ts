import { useEffect, useRef, useState } from "react";
import { pendingManagedAgentMcpCalls } from "./managedAgentMcpTools";

export function useManagedAgentMcpToolCalls({
  enabled, messages, messageId, status, execute,
}: {
  enabled: boolean;
  messages: any[];
  messageId?: string;
  status: string;
  execute: (toolCall: { toolCallId: string; toolName: string; input: unknown }, signal: AbortSignal) => Promise<unknown>;
}) {
  const started = useRef(new Set<string>());
  const lifetime = useRef<AbortController | null>(null);
  const [running, setRunning] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    lifetime.current = controller;
    setRunning(0);
    return () => controller.abort();
  }, [enabled]);
  useEffect(() => {
    if (!enabled || !messageId || messages.at(-1)?.id !== messageId) return;
    const signal = lifetime.current!.signal;
    for (const call of pendingManagedAgentMcpCalls(messages, status)) {
      const key = JSON.stringify([messages.at(-1)?.id, call.toolCallId]);
      void Promise.resolve().then(() => {
        if (signal.aborted || started.current.has(key)) return;
        started.current.add(key);
        setRunning(count => count + 1);
        return execute(call, signal).finally(() => {
          if (!signal.aborted) setRunning(count => count - 1);
        });
      });
    }
  }, [enabled, messages, messageId, status, execute]);
  return enabled && running > 0;
}
