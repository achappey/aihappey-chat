import { useEffect, useRef, useState } from "react";
import { repeatBenchmarkBatch, snapshotBenchmarkBatch, startBenchmarkBatch } from "./benchmarkRunner";
import { redactBenchmarkError } from "./benchmarkRequest";
import type { BenchmarkBatch, BenchmarkEnvironment, BenchmarkRun, BenchmarkTarget } from "./types";

export function useBenchmarkSession(env: BenchmarkEnvironment) {
  const [runs, setRuns] = useState<BenchmarkRun[]>([]);
  const [batches, setBatches] = useState<BenchmarkBatch[]>([]);
  const [lastBatch, setLastBatch] = useState<BenchmarkBatch>();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string>();
  const active = useRef<ReturnType<typeof startBenchmarkBatch> | null>(null);
  const generation = useRef(0);
  const ordinal = useRef(0);

  useEffect(() => () => {
    // Invalidate callbacks before aborting, including synchronous cancellation updates.
    generation.current++;
    active.current?.stop();
    active.current = null;
  }, []);

  const launch = (build: () => BenchmarkBatch) => {
    if (active.current) return;
    try {
      const batch = build();
      const current = ++generation.current;
      ordinal.current = batch.ordinal;
      setError(undefined);
      setLastBatch(batch);
      setBatches(previous => [...previous, batch]);
      setRunning(true);
      const execution = startBenchmarkBatch(batch, env, run => {
        if (generation.current !== current) return;
        setRuns(previous => {
          const index = previous.findIndex(item => item.id === run.id);
          return index < 0 ? [...previous, run] : previous.map((item, i) => i === index ? run : item);
        });
      });
      active.current = execution;
      void execution.done.catch(cause => {
        if (generation.current === current) setError(redactBenchmarkError(cause, env));
      }).finally(() => {
        if (generation.current !== current || active.current !== execution) return;
        active.current = null;
        setRunning(false);
      });
    } catch (cause) {
      setError(redactBenchmarkError(cause, env));
      setRunning(false);
    }
  };

  return {
    runs, batches, lastBatch, running, error,
    start: (input: { prompt: string; repeats: number; concurrency: number; targets: BenchmarkTarget[] }) =>
      launch(() => snapshotBenchmarkBatch({ ...input, ordinal: ordinal.current + 1 }, env)),
    runAgain: () => { if (lastBatch) launch(() => repeatBenchmarkBatch(lastBatch, ordinal.current + 1, env)); },
    stop: () => active.current?.stop(),
    clear: () => {
      if (active.current) return;
      generation.current++;
      setRuns([]);
      setBatches([]);
      setError(undefined);
    },
  };
}
