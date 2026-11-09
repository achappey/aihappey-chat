import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { ChartCard, Grid, Section, chartOptions, formatMetric, tableStyle, tdStyle, thStyle } from "../usage/UsageDashboardPrimitives";
import type { BenchmarkBatch, BenchmarkRun } from "./types";

/** Each point is one reported per-run value, never an aggregate or an estimate. */
export function benchmarkChartData(runs: BenchmarkRun[], metric: "ttft" | "tps", label: (run: BenchmarkRun) => string) {
  const series = new Map<string, { target: BenchmarkRun; values: Map<number, number | undefined> }>();
  let repeatCount = 0;
  runs.forEach(run => {
    const key = `${run.batchId}/${run.targetId}`;
    if (!series.has(key)) series.set(key, { target: run, values: new Map() });
    series.get(key)!.values.set(run.repetition, run[metric]);
    repeatCount = Math.max(repeatCount, run.repetition);
  });
  const repetitions = Array.from({ length: repeatCount }, (_, index) => index + 1);
  return {
    labels: repetitions.map(String),
    datasets: Array.from(series.values(), ({ target, values }) => ({
      label: label(target), borderColor: target.color, backgroundColor: target.color,
      pointRadius: 4, tension: 0, spanGaps: false,
      data: repetitions.map(repetition => values.get(repetition) ?? null),
    })),
  };
}

export function BenchmarkResults({ runs, batches }: { runs: BenchmarkRun[]; batches: BenchmarkBatch[] }) {
  const { Card, Text } = useTheme();
  const { t } = useTranslation();
  const label = (run: BenchmarkRun) => `${t("ai.benchmarks.batch", { number: run.batchOrdinal })} · ${t("ai.benchmarks.target", { number: run.targetOrdinal })} · ${run.modelLabel} · ${run.mode === "direct" ? t("ai.benchmarks.direct") : t("ai.benchmarks.gateway")} · ${run.endpoint}`;
  const options = (unit: string) => ({ ...chartOptions(), animation: false,
    scales: { x: { title: { display: true, text: t("ai.benchmarks.repetition") }, ticks: { precision: 0 } },
      y: { beginAtZero: true, title: { display: true, text: unit } } } });
  return <Section>
    <Grid>
      <ChartCard title={t("ai.benchmarks.ttft")} type="line" data={benchmarkChartData(runs, "ttft", label)}
        options={options(t("ai.benchmarks.seconds"))} noDataDescription={t("ai.benchmarks.waitingMetrics")} />
      <ChartCard title={t("ai.benchmarks.tps")} type="line" data={benchmarkChartData(runs, "tps", label)}
        options={options(t("ai.benchmarks.tps"))} noDataDescription={t("ai.benchmarks.waitingMetrics")} />
    </Grid>
    <Text>{t("ai.benchmarks.metricsNote")}</Text>
    <Card title={t("ai.benchmarks.results")} size="small">
      {!runs.length ? <Text>{t("ai.benchmarks.noResults")}</Text> : <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead><tr>{["batchColumn", "targetColumn", "repetition", "status", "ttft", "tps", "error"].map(key =>
            <th key={key} scope="col" style={thStyle}>{t(`ai.benchmarks.${key}`)}</th>)}</tr></thead>
          <tbody>{runs.map(run => <tr key={run.id}>
            <td style={tdStyle}>{t("ai.benchmarks.batch", { number: run.batchOrdinal })}</td>
            <td style={{ ...tdStyle, minWidth: 220, overflowWrap: "anywhere" }}>
              <span aria-hidden="true" style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: run.color, marginRight: 6 }} />
              {t("ai.benchmarks.target", { number: run.targetOrdinal })} · {run.modelLabel}
              <div>{run.mode === "direct" ? t("ai.benchmarks.direct") : t("ai.benchmarks.gateway")} · {run.endpoint}</div>
            </td>
            <td style={tdStyle}>{run.repetition}</td>
            <td style={tdStyle}>{t(`ai.benchmarks.statuses.${run.status}`)}</td>
            <td style={tdStyle}>{formatMetric(run.ttft, "s")}</td>
            <td style={tdStyle}>{formatMetric(run.tps)}</td>
            <td style={{ ...tdStyle, overflowWrap: "anywhere", maxWidth: 360 }}>{run.error ?? "—"}</td>
          </tr>)}</tbody>
        </table>
      </div>}
    </Card>
    {batches.length > 0 && <Card title={t("ai.benchmarks.batchInputs")} size="small">
      {batches.map(batch => <details key={batch.id} style={{ marginBottom: 8 }}>
        <summary>{t("ai.benchmarks.batch", { number: batch.ordinal })} · {t("ai.benchmarks.repeatCount")}: {batch.repeats}</summary>
        <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontFamily: "inherit" }}>{batch.prompt}</pre>
        {batch.targets.map(target => <p key={target.id} style={{ overflowWrap: "anywhere" }}>
          {t("ai.benchmarks.target", { number: target.ordinal })} · {target.modelLabel} · {target.mode === "direct" ? t("ai.benchmarks.direct") : t("ai.benchmarks.gateway")} · {target.endpoint}
        </p>)}
      </details>)}
    </Card>}
  </Section>;
}
