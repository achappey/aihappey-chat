import { useRef, useState } from "react";
import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { store, useAppStore, type ChatEndpointId } from "aihappey-state";
import { useChatContext } from "../chat/context/ChatContext";
import { ModelSelect } from "../models/ModelSelect";
import { useProviderRegistry } from "../../runtime/providers/useProviderRegistry";
import { OverviewPageHeader } from "../../ui/layout/OverviewPageHeader";
import { Grid, Section, palette } from "../usage/UsageDashboardPrimitives";
import { benchmarkEndpoints, benchmarkGatewayAvailable, resolveBenchmarkTarget } from "./benchmarkRouting";
import { MAX_BENCHMARK_CONCURRENCY, MAX_BENCHMARK_REPEATS, validateBenchmarkSetup } from "./benchmarkRunner";
import { BenchmarkSettingsModal } from "./BenchmarkSettingsModal";
import { BenchmarkResults } from "./BenchmarkResults";
import { useBenchmarkSession } from "./useBenchmarkSession";
import type { BenchmarkEnvironment, BenchmarkSettings, BenchmarkTarget } from "./types";

export function BenchmarksPage() {
  const { Card, Text, TextArea, Input, Select, Switch, Button, Alert } = useTheme();
  const { t } = useTranslation();
  const { config } = useChatContext();
  const models = useAppStore(state => state.models);
  const modelsLoaded = useAppStore(state => state.modelsLoaded);
  const customHeaders = useAppStore(state => state.customHeaders);
  const gatewayEnabled = useAppStore(state => state.gatewayEnabled);
  const providers = useProviderRegistry();
  const env: BenchmarkEnvironment = { config, models: models ?? [], providers, customHeaders, gatewayEnabled };
  const ordinal = useRef(1);
  const [seed] = useState(() => {
    const state = store.getState();
    return {
      modelId: state.selectedModel ?? "", mode: config.getAccessToken ? "default" as const : state.effectiveChatEndpointMode ?? "default",
      endpoint: state.effectiveChatEndpoint ?? "/api/chat",
      settings: structuredClone({ temperature: state.temperature, maxOutputTokens: state.maxOutputTokens,
        providerMetadata: state.providerMetadata ?? {}, providerHeaders: state.providerHeaders ?? {} }) as BenchmarkSettings,
    };
  });
  const [targets, setTargets] = useState<BenchmarkTarget[]>(() => [{ ...structuredClone(seed), id: crypto.randomUUID(), ordinal: 1, color: palette[0] }]);
  const [prompt, setPrompt] = useState("");
  const [repeats, setRepeats] = useState(3);
  const [parallel, setParallel] = useState(false);
  const [parallelism, setParallelism] = useState(2);
  const [settingsId, setSettingsId] = useState<string>();
  const session = useBenchmarkSession(env);
  const concurrency = parallel ? parallelism : 1;
  const selectedTarget = targets.find(target => target.id === settingsId);
  const update = (id: string, patch: Partial<BenchmarkTarget>) => setTargets(current => current.map(target => target.id === id ? { ...target, ...patch } : target));
  const add = (source?: BenchmarkTarget) => {
    const number = ++ordinal.current;
    setTargets(current => [...current, { ...structuredClone(source ?? seed), id: crypto.randomUUID(), ordinal: number,
      color: palette[(number - 1) % palette.length] }]);
  };
  const targetErrors = targets.map(target => {
    try { resolveBenchmarkTarget(target, env); return undefined; }
    catch (cause) { return cause instanceof Error ? cause.message : t("ai.benchmarks.unavailable"); }
  });
  let setupError: string | undefined;
  try { validateBenchmarkSetup(prompt, repeats, concurrency, targets); }
  catch (cause) { setupError = cause instanceof Error ? cause.message : t("ai.benchmarks.unavailable"); }

  return <div style={{ background: "transparent" }}>
    <div style={{ width: 1140, maxWidth: "100%", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center",
      paddingLeft: 12, paddingRight: 12, paddingBottom: 32, boxSizing: "border-box" }}>
      <OverviewPageHeader title={t("ai.benchmarks.title")} />
      <Section>
        <Text as="p" align="center" style={{ marginTop: 0 }}>{t("ai.benchmarks.subtitle")}</Text>
        {config.getAccessToken && <Alert variant="info">{t("ai.benchmarks.azureRestriction")}</Alert>}
        <Card title={t("ai.benchmarks.setup")} size="small">
          <Section>
            <TextArea label={t("ai.benchmarks.prompt")} rows={4} value={prompt} onChange={setPrompt} required />
            <Grid compact>
              <Input label={t("ai.benchmarks.repeatCount")} type="number" min={1} max={MAX_BENCHMARK_REPEATS} step={1} value={Number.isNaN(repeats) ? "" : repeats}
                onChange={event => setRepeats(event.target.value === "" ? NaN : Number(event.target.value))} />
              <Switch label={t("ai.benchmarks.parallel")} checked={parallel} onChange={setParallel} />
              {parallel && <Input label={t("ai.benchmarks.concurrency")} type="number" min={1} max={MAX_BENCHMARK_CONCURRENCY} step={1}
                value={Number.isNaN(parallelism) ? "" : parallelism} onChange={event => setParallelism(event.target.value === "" ? NaN : Number(event.target.value))} />}
            </Grid>
          </Section>
        </Card>
        <Grid>
          {targets.map((target, index) => {
            const endpoints = benchmarkEndpoints(target, env);
            return <Card key={target.id} size="small" title={t("ai.benchmarks.target", { number: target.ordinal })}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, borderTop: `3px solid ${target.color}`, paddingTop: 12 }}>
                <ModelSelect models={models ?? []} value={target.modelId} autoSelectFallback={false}
                  onChange={modelId => update(target.id, { modelId })} label={t("model")} required />
                <Select label={t("ai.benchmarks.routing")} value={target.mode} onChange={(mode: BenchmarkTarget["mode"]) => update(target.id, { mode })}>
                  <option value="default" disabled={!benchmarkGatewayAvailable(env)}>{t("ai.benchmarks.gateway")}</option>
                  <option value="direct" disabled={!!config.getAccessToken}>{t("ai.benchmarks.direct")}</option>
                </Select>
                <Select label={t("ai.benchmarks.endpoint")} value={target.endpoint} onChange={(endpoint: ChatEndpointId) => update(target.id, { endpoint })}>
                  {!endpoints.includes(target.endpoint) && <option value={target.endpoint} disabled>{target.endpoint} — {t("ai.benchmarks.unavailable")}</option>}
                  {endpoints.map(endpoint => <option key={endpoint} value={endpoint}>{endpoint === "/api/chat" ? `API Chat (${endpoint})` : endpoint}</option>)}
                </Select>
                {targetErrors[index] && <Alert variant="warning">{targetErrors[index]}</Alert>}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <Button variant="secondary" icon="settings" disabled={!target.modelId} onClick={() => setSettingsId(target.id)}>{t("ai.benchmarks.settings")}</Button>
                  <Button variant="secondary" onClick={() => add(target)}>{t("ai.benchmarks.duplicate")}</Button>
                  <Button variant="secondary" onClick={() => setTargets(current => current.filter(item => item.id !== target.id))}>{t("ai.benchmarks.remove")}</Button>
                </div>
              </div>
            </Card>;
          })}
        </Grid>
        <div><Button variant="secondary" icon="add" onClick={() => add()}>{t("ai.benchmarks.addTarget")}</Button></div>
        <Text>{t("ai.benchmarks.snapshotNote")}</Text>
        {!modelsLoaded && <Text>{t("ai.benchmarks.loadingModels")}</Text>}
        {session.error && <Alert variant="danger">{session.error}</Alert>}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Button disabled={session.running || !modelsLoaded || !!setupError || targetErrors.some(Boolean)}
            title={setupError ?? targetErrors.find(Boolean)} onClick={() => session.start({ prompt, repeats, concurrency, targets })}>{t("ai.benchmarks.start")}</Button>
          <Button variant="secondary" disabled={!session.running} onClick={session.stop}>{t("ai.benchmarks.stop")}</Button>
          <Button variant="secondary" disabled={session.running || !session.lastBatch} onClick={session.runAgain}>{t("ai.benchmarks.runAgain")}</Button>
          <Button variant="secondary" disabled={session.running || !session.runs.length} onClick={session.clear}>{t("ai.benchmarks.clear")}</Button>
        </div>
        <div role="status" aria-live="polite"><Text>{session.running ? t("ai.benchmarks.running") : t("ai.benchmarks.ready")}</Text></div>
        <BenchmarkResults runs={session.runs} batches={session.batches} />
      </Section>
    </div>
    {selectedTarget && <BenchmarkSettingsModal key={selectedTarget.id} target={selectedTarget} env={env} appTitle={config.appName}
      onSave={settings => update(selectedTarget.id, { settings })} onClose={() => setSettingsId(undefined)} />}
  </div>;
}
