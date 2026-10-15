import { useEffect, useRef } from "react";
import { pendingManagedAgentMcpCalls } from "./managedAgentMcpTools";

export function useManagedAgentMcpToolCalls({
  enabled, messages, status, execute,
}: {
  enabled: boolean;
  messages: any[];
  status: string;
  execute: (toolCall: { toolCallId: string; toolName: string; input: unknown }, signal: AbortSignal) => Promise<unknown>;
}) {
  const started = useRef(new Set<string>());
  const lifetime = useRef<AbortController | null>(null);
  useEffect(() => {
    lifetime.current = new AbortController();
    return () => lifetime.current?.abort();
  }, []);
  useEffect(() => {
    if (!enabled) return;
    const signal = lifetime.current!.signal;
    for (const call of pendingManagedAgentMcpCalls(messages, status)) {
      const key = JSON.stringify([messages.at(-1)?.id, call.toolCallId]);
      void Promise.resolve().then(() => {
        if (signal.aborted || started.current.has(key)) return;
        started.current.add(key);
        return execute(call, signal);
      });
    }
  }, [enabled, messages, status, execute]);
}
