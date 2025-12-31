export type ToolApprovalDecision = { approved: boolean; reason?: string };

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (v: T) => void;
  reject: (e: any) => void;
};

function deferred<T>(): Deferred<T> {
  let resolve!: (v: T) => void;
  let reject!: (e: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const pending = new Map<string, Deferred<ToolApprovalDecision>>();
const resolved = new Map<string, ToolApprovalDecision>();

export const toolApprovalGate = {
  wait(toolCallId: string, signal?: AbortSignal): Promise<ToolApprovalDecision> {
    const already = resolved.get(toolCallId);
    if (already) {
      resolved.delete(toolCallId);
      return Promise.resolve(already);
    }

    const existing = pending.get(toolCallId);
    if (existing) return existing.promise;

    const d = deferred<ToolApprovalDecision>();
    pending.set(toolCallId, d);

    if (signal) {
      if (signal.aborted) {
        pending.delete(toolCallId);
        return Promise.reject(new DOMException("Aborted", "AbortError"));
      }
      const onAbort = () => {
        pending.delete(toolCallId);
        d.reject(new DOMException("Aborted", "AbortError"));
      };
      signal.addEventListener("abort", onAbort, { once: true });
      d.promise.finally(() => signal.removeEventListener("abort", onAbort));
    }

    return d.promise;
  },

  resolve(toolCallId: string, decision: ToolApprovalDecision) {
    const d = pending.get(toolCallId);
    if (d) {
      pending.delete(toolCallId);
      d.resolve(decision);
      return;
    }
    // approval kwam eerder dan wait()
    resolved.set(toolCallId, decision);
  },
};
