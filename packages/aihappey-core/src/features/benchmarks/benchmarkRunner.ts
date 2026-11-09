import { resolveBenchmarkTarget, validateBenchmarkSnapshot } from "./benchmarkRouting";
import { executeBenchmarkRequest, redactBenchmarkError } from "./benchmarkRequest";
import type { BenchmarkBatch, BenchmarkEnvironment, BenchmarkMetrics, BenchmarkRun,
  BenchmarkTarget, BenchmarkTargetSnapshot } from "./types";

export const MAX_BENCHMARK_CONCURRENCY = 8;
export const MAX_BENCHMARK_REPEATS = 100;

export function validateBenchmarkSetup(prompt: string, repeats: number, concurrency: number, targets: unknown[]) {
  if (!prompt.trim()) throw new Error("Enter a shared prompt.");
  if (!targets.length) throw new Error("Add at least one target.");
  if (!Number.isInteger(repeats) || repeats < 1 || repeats > MAX_BENCHMARK_REPEATS) {
    throw new Error(`Repeat count must be an integer from 1 to ${MAX_BENCHMARK_REPEATS}.`);
  }
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > MAX_BENCHMARK_CONCURRENCY) {
    throw new Error(`Concurrency must be an integer from 1 to ${MAX_BENCHMARK_CONCURRENCY}.`);
  }
}

function freeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

export function snapshotBenchmarkBatch(input: {
  ordinal: number; prompt: string; repeats: number; concurrency: number; targets: BenchmarkTarget[];
}, env: BenchmarkEnvironment): BenchmarkBatch {
  validateBenchmarkSetup(input.prompt, input.repeats, input.concurrency, input.targets);
  return freeze({ ...input, id: crypto.randomUUID(), targets: input.targets.map(target => resolveBenchmarkTarget(target, env)) });
}

export function repeatBenchmarkBatch(previous: BenchmarkBatch, ordinal: number, env: BenchmarkEnvironment): BenchmarkBatch {
  previous.targets.forEach(target => validateBenchmarkSnapshot(target, env));
  return freeze({ ...structuredClone(previous), id: crypto.randomUUID(), ordinal });
}

type Execute = (args: { target: BenchmarkTargetSnapshot; prompt: string; env: BenchmarkEnvironment;
  signal: AbortSignal; onMetrics: (metrics: BenchmarkMetrics) => void }) => Promise<void>;

/** Round-robin repetitions, deterministic queue order, bounded workers, and one cancellation domain per batch. */
export function startBenchmarkBatch(batch: BenchmarkBatch, environment: BenchmarkEnvironment,
  onRun: (run: BenchmarkRun) => void, execute: Execute = executeBenchmarkRequest) {
  validateBenchmarkSetup(batch.prompt, batch.repeats, batch.concurrency, batch.targets);
  // Credentials/config are pinned for this execution, not retained in result records or rerun snapshots.
  const env: BenchmarkEnvironment = { ...environment, config: { ...environment.config,
    headers: { ...environment.config.headers } }, customHeaders: { ...environment.customHeaders },
    models: structuredClone(environment.models), providers: { ...environment.providers } };
  const controller = new AbortController();
  const jobs: { target: BenchmarkTargetSnapshot; run: BenchmarkRun }[] = [];
  for (let repetition = 1; repetition <= batch.repeats; repetition++) {
    for (const target of batch.targets) {
      const run: BenchmarkRun = {
        id: `${batch.id}/${target.id}/${repetition}`, batchId: batch.id, batchOrdinal: batch.ordinal,
        targetId: target.id, targetOrdinal: target.ordinal, color: target.color, modelLabel: target.modelLabel,
        mode: target.mode, endpoint: target.endpoint, repetition, status: "queued",
      };
      jobs.push({ target, run });
      onRun(run);
    }
  }
  const update = (job: typeof jobs[number], patch: Partial<BenchmarkRun>) => {
    job.run = { ...job.run, ...patch };
    onRun(job.run);
  };
  let next = 0;
  const worker = async () => {
    while (!controller.signal.aborted && next < jobs.length) {
      const job = jobs[next++];
      update(job, { status: "running" });
      try {
        await execute({ target: job.target, prompt: batch.prompt, env, signal: controller.signal,
          onMetrics: metrics => {
            if (!controller.signal.aborted && job.run.status === "running") update(job, metrics);
          } });
        if (!controller.signal.aborted) update(job, { status: "completed" });
      } catch (error) {
        if (!controller.signal.aborted) update(job, { status: "failed", error: redactBenchmarkError(error, env, job.target) });
      }
    }
  };
  return {
    stop() {
      if (controller.signal.aborted) return;
      controller.abort();
      for (const job of jobs) {
        if (job.run.status === "queued" || job.run.status === "running") update(job, { status: "cancelled" });
      }
    },
    done: Promise.all(Array.from({ length: Math.min(batch.concurrency, jobs.length) }, worker)).then(() => {}),
  };
}
