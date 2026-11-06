/** Browser-observed timings for one native provider request, never an entire tool loop. */
export const createDirectChatPerformance = (now: () => number = () => performance.now()) => {
  const dispatchedAt = now();
  let firstOutputAt: number | undefined;
  let completedAt: number | undefined;
  let outputTokens: number | undefined;
  let failed = false;

  return {
    observe(chunk: any) {
      if (chunk.type === "error") failed = true;
      if (firstOutputAt !== undefined || completedAt !== undefined) return;
      const nonEmpty = (value: unknown) => typeof value === "string" && value.length > 0;
      const generated = ((chunk.type === "text-delta" || chunk.type === "reasoning-delta") && nonEmpty(chunk.delta))
        || (chunk.type === "tool-input-start" && nonEmpty(chunk.toolName))
        || (chunk.type === "tool-input-delta" && nonEmpty(chunk.inputTextDelta))
        || (chunk.type === "tool-input-available" && nonEmpty(chunk.toolName))
        || (chunk.type === "file" && nonEmpty(chunk.url));
      if (generated) firstOutputAt = now();
    },
    complete(tokens: unknown) {
      if (completedAt !== undefined) return;
      completedAt = now();
      if (!failed && validPerformanceMetric(tokens)) outputTokens = tokens;
    },
    gatewayMetadata(gateway: any) {
      if (firstOutputAt === undefined) return gateway;
      const ttft = (firstOutputAt - dispatchedAt) / 1000;
      const duration = completedAt === undefined ? undefined : (completedAt - firstOutputAt) / 1000;
      const tps = outputTokens !== undefined && duration !== undefined && duration > 0
        ? outputTokens / duration : undefined;
      return {
        ...(gateway ?? {}),
        ...(!validPerformanceMetric(gateway?.ttft) && validPerformanceMetric(ttft) ? { ttft } : {}),
        ...(!validPerformanceMetric(gateway?.tps) && validPerformanceMetric(tps) ? { tps } : {}),
      };
    },
  };
};

const validPerformanceMetric = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

export type DirectChatPerformance = ReturnType<typeof createDirectChatPerformance>;
