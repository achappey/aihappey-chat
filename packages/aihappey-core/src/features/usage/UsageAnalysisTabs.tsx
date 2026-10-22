import { JSX, useEffect, useMemo, useState } from "react";
import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import type { IconToken } from "aihappey-types";
import type { UsageAnalytics, UsageModelStat, UsageMessageFact } from "./usageAnalytics";
import {
  sortedMapEntries,
  topCounts,
  topModelStats,
  topProviderStats,
  topToolStats,
  summarizeMetric,
} from "./usageAnalytics";
import {
  ChartCard,
  Grid,
  KpiCard,
  Section,
  chartOptions,
  formatCompact,
  formatCost,
  formatMetric,
  formatNumber,
  horizontalBarOptions,
  palette,
  tableStyle,
  tdStyle,
  thStyle,
} from "./UsageDashboardPrimitives";

type Props = {
  analytics: UsageAnalytics;
  t: (key: string, options?: any) => string;
};

type UsageTab = {
  key: string;
  icon: IconToken;
  title: string;
  render: () => JSX.Element;
};

const noData = (t: Props["t"]) => t("ai.usage.noDataDescription");

const barDataFromCounts = (items: Array<{ label: string; count: number }>, label: string) => ({
  labels: items.map((item) => item.label),
  datasets: [
    {
      label,
      data: items.map((item) => item.count),
      backgroundColor: items.map((_, index) => palette[index % palette.length]),
    },
  ],
});

const lineDataFromEntries = (entries: [string, number][], label: string, color = palette[0]) => ({
  labels: entries.map(([key]) => key),
  datasets: [
    {
      label,
      data: entries.map(([, value]) => value),
      borderColor: color,
      backgroundColor: `${color}33`,
      fill: true,
      tension: 0.25,
      pointRadius: 0,
      pointHitRadius: 8,
    },
  ],
});

const doughnutDataFromCounts = (items: Array<{ label: string; count: number }>, label: string) => ({
  labels: items.map((item) => item.label),
  datasets: [
    {
      label,
      data: items.map((item) => item.count),
      backgroundColor: items.map((_, index) => palette[index % palette.length]),
    },
  ],
});

const topConversationData = (analytics: UsageAnalytics, metric: "tokens" | "cost" | "messageCount") => {
  const items = [...analytics.conversationFacts]
    .sort((a, b) => Number(b[metric]) - Number(a[metric]))
    .slice(0, 12);
  return {
    labels: items.map((item) => item.name),
    datasets: [
      {
        label: metric,
        data: items.map((item) => Number(item[metric]) || 0),
        backgroundColor: items.map((_, index) => palette[index % palette.length]),
      },
    ],
  };
};

const conversationSizeBuckets = (analytics: UsageAnalytics) => {
  const buckets = new Map<string, number>([
    ["0-2", 0],
    ["3-5", 0],
    ["6-10", 0],
    ["11-20", 0],
    ["21+", 0],
  ]);
  for (const conversation of analytics.conversationFacts) {
    const count = conversation.messageCount;
    const key = count <= 2 ? "0-2" : count <= 5 ? "3-5" : count <= 10 ? "6-10" : count <= 20 ? "11-20" : "21+";
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return barDataFromCounts(Array.from(buckets, ([label, count]) => ({ label, count })), "");
};

const OverviewTabs = ({ analytics, t }: Props) => {
  const tabs: UsageTab[] = [
    {
      key: "summary",
      icon: "chart",
      title: t("ai.usage.summary"),
      render: () => (
        <Section>
          <Grid compact>
            <KpiCard title={t("ai.usage.conversations")} value={formatNumber(analytics.conversations)} />
            <KpiCard title={t("ai.usage.messages")} value={formatNumber(analytics.messages)} />
            <KpiCard title={t("models")} value={formatNumber(analytics.modelStats.size)} />
            <KpiCard title={t("agents.title")} value={formatNumber(analytics.agentStats.size)} />
            <KpiCard title={t("ai.usage.totalTokens")} value={formatCompact(analytics.tokenTotals.total)} />
            <KpiCard title={t("ai.usage.estimatedCost")} value={formatCost(analytics.totalCost)} />
          </Grid>
          <Grid>
            <ChartCard title={t("ai.usage.roleMix")} type="doughnut" data={doughnutDataFromCounts(topCounts(analytics.roleCounts), t("ai.usage.messages"))} noDataDescription={noData(t)} />
            <ChartCard title={t("ai.usage.activityOverTime")} type="line" data={lineDataFromEntries(sortedMapEntries(analytics.dailyMessages), t("ai.usage.messages"))} options={chartOptions()} noDataDescription={noData(t)} />
          </Grid>
        </Section>
      ),
    },
    {
      key: "conversations",
      icon: "chat",
      title: t("ai.usage.conversations"),
      render: () => (
        <Section>
          <Grid>
            <ChartCard title={t("ai.usage.conversationSizeDistribution")} type="bar" data={conversationSizeBuckets(analytics)} options={chartOptions()} noDataDescription={noData(t)} />
            <ChartCard title={t("ai.usage.topConversationsByMessages")} type="bar" data={topConversationData(analytics, "messageCount")} options={horizontalBarOptions()} noDataDescription={noData(t)} />
          </Grid>
        </Section>
      ),
    },
    {
      key: "activity",
      icon: "trending",
      title: t("ai.usage.activity"),
      render: () => (
        <Grid>
          <ChartCard title={t("ai.usage.hourOfDay")} type="bar" data={barDataFromCounts(sortedMapEntries(analytics.hourCounts).map(([label, count]) => ({ label, count })), t("ai.usage.messages"))} options={chartOptions()} noDataDescription={noData(t)} />
          <ChartCard title={t("ai.usage.dailyTokens")} type="line" data={lineDataFromEntries(sortedMapEntries(analytics.dailyTokens), t("ai.usage.tokens"), palette[2])} options={chartOptions()} noDataDescription={noData(t)} />
        </Grid>
      ),
    },
    ...contentTabs({ analytics, t }),
    ...patternTabs({ analytics, t }),
  ];

  return <VerticalTabs tabs={tabs} />;
};

const ModelsProvidersTabs = ({ analytics, t }: Props) => {
  const models = topModelStats(analytics.modelStats, 15);
  const providers = topProviderStats(analytics.providerStats, 15);
  const tabs: UsageTab[] = [
    {
      key: "models",
      icon: "brain",
      title: t("models"),
      render: () => <EntityUsageView stats={analytics.modelStats} agent={false} t={t} />,
    },
    {
      key: "agents",
      icon: "robot",
      title: t("agents.title"),
      render: () => <EntityUsageView stats={analytics.agentStats} agent t={t} />,
    },
    {
      key: "providers",
      icon: "providers",
      title: t("providers"),
      render: () => (
        <Grid>
          <ChartCard title={t("ai.usage.topProviders")} type="bar" data={{ labels: providers.map((p) => p.label), datasets: [{ label: t("ai.usage.messages"), data: providers.map((p) => p.count), backgroundColor: palette[1] }] }} options={horizontalBarOptions()} noDataDescription={noData(t)} />
          <ChartCard title={t("ai.usage.providerUniqueModels")} type="bar" data={{ labels: providers.map((p) => p.label), datasets: [{ label: t("ai.usage.models"), data: providers.map((p) => p.models.size), backgroundColor: palette[7] }] }} options={horizontalBarOptions()} noDataDescription={noData(t)} />
        </Grid>
      ),
    },
    {
      key: "matrix",
      icon: "connect",
      title: t("ai.usage.matrix"),
      render: () => {
        const providerLabels = providers.slice(0, 8).map((p) => p.label);
        const modelLabels = models.slice(0, 8).map((m) => m.label);
        const matrix = modelLabels.map((modelLabel) => ({
          label: modelLabel,
          data: providerLabels.map((providerLabel) =>
            analytics.messageFacts.filter((fact) => fact.entityKind === "model" && fact.modelLabel === modelLabel && fact.providerLabel === providerLabel).length
          ),
          backgroundColor: palette[modelLabels.indexOf(modelLabel) % palette.length],
        }));
        return <ChartCard title={t("ai.usage.providerModelMatrix")} type="bar" data={{ labels: providerLabels, datasets: matrix }} options={{ ...chartOptions(), scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } } }} noDataDescription={noData(t)} />;
      },
    },
  ];
  return <VerticalTabs tabs={tabs} />;
};

const EntityUsageView = ({ stats, agent, t }: { stats: Map<string, UsageModelStat>; agent: boolean; t: Props["t"] }) => {
  const all = topModelStats(stats, stats.size);
  const items = all.slice(0, 12);
  return (
    <Section>
      <Grid>
        <ChartCard title={t(agent ? "ai.usage.topAgents" : "ai.usage.topModels")} type="bar" data={barDataFromCounts(items, t("ai.usage.messages"))} options={horizontalBarOptions()} noDataDescription={noData(t)} />
        <ChartCard title={t(agent ? "ai.usage.agentTokens" : "ai.usage.modelTokens")} type="bar" data={{ labels: items.map((item) => item.label), datasets: [{ label: t("ai.usage.tokens"), data: items.map((item) => item.tokens), backgroundColor: palette[2] }] }} options={horizontalBarOptions()} noDataDescription={noData(t)} />
      </Grid>
      <UsageTable title={t(agent ? "agents.title" : "models")} headers={[t(agent ? "agent" : "model"), t("ai.usage.messages"), t("ai.usage.tokens"), t("ai.usage.cost")]} rows={all.map((item) => [item.label, formatNumber(item.count), formatCompact(item.tokens), formatCost(item.cost)])} />
    </Section>
  );
};

const TokensCostTabs = ({ analytics, t }: Props) => {
  const outliers = analytics.messageFacts.filter((fact) => fact.tokens > 0).sort((a, b) => b.tokens - a.tokens).slice(0, 12);
  const costOutliers = analytics.messageFacts.filter((fact) => fact.cost > 0).sort((a, b) => b.cost - a.cost).slice(0, 12);
  const tabs: UsageTab[] = [
    {
      key: "tokens",
      icon: "maxOutputTokens",
      title: t("ai.usage.tokens"),
      render: () => (
        <Section>
          <Grid compact>
            <KpiCard title={t("ai.usage.inputTokens")} value={formatCompact(analytics.tokenTotals.input)} />
            <KpiCard title={t("ai.usage.outputTokens")} value={formatCompact(analytics.tokenTotals.output)} />
            <KpiCard title={t("ai.usage.totalTokens")} value={formatCompact(analytics.tokenTotals.total)} />
          </Grid>
          <Grid>
            <ChartCard title={t("ai.usage.tokenBreakdown")} type="doughnut" data={doughnutDataFromCounts([{ label: t("ai.usage.inputTokens"), count: analytics.tokenTotals.input }, { label: t("ai.usage.outputTokens"), count: analytics.tokenTotals.output }], t("ai.usage.tokens"))} noDataDescription={noData(t)} />
            <ChartCard title={t("ai.usage.dailyTokens")} type="line" data={lineDataFromEntries(sortedMapEntries(analytics.dailyTokens), t("ai.usage.tokens"), palette[2])} options={chartOptions()} noDataDescription={noData(t)} />
          </Grid>
        </Section>
      ),
    },
    {
      key: "cost",
      icon: "pricing",
      title: t("ai.usage.cost"),
      render: () => (
        <Section>
          <KpiCard title={t("ai.usage.estimatedCost")} value={formatCost(analytics.totalCost)} />
          <Grid>
          <ChartCard title={t("ai.usage.dailyCost")} type="line" data={lineDataFromEntries(sortedMapEntries(analytics.dailyCost), t("ai.usage.cost"), palette[5])} options={chartOptions()} noDataDescription={noData(t)} />
          <ChartCard title={t("ai.usage.topConversationsByCost")} type="bar" data={topConversationData(analytics, "cost")} options={horizontalBarOptions()} noDataDescription={noData(t)} />
          </Grid>
        </Section>
      ),
    },
    {
      key: "outliers",
      icon: "trending",
      title: t("ai.usage.outliers"),
      render: () => (
        <Section>
          <UsageTable title={t("ai.usage.largestTokenUsage")} headers={[t("title"), t("ai.usage.tokens"), t("ai.usage.cost"), t("ai.usage.tabModelsAgents")]} rows={outliers.map((fact) => [fact.conversationName, formatCompact(fact.tokens), formatCost(fact.cost), fact.entityLabel ?? "—"])} />
          <UsageTable title={t("ai.usage.largestCost")} headers={[t("title"), t("ai.usage.cost"), t("ai.usage.tokens"), t("ai.usage.tabModelsAgents")]} rows={costOutliers.map((fact) => [fact.conversationName, formatCost(fact.cost), formatCompact(fact.tokens), fact.entityLabel ?? "—"])} />
        </Section>
      ),
    },
  ];
  return <VerticalTabs tabs={tabs} />;
};

const metricTrends = (facts: UsageMessageFact[], metric: "ttft" | "tps", label: string, color: string) => {
  const days = new Map<string, number[]>();
  for (const fact of facts) {
    if (!fact.day || fact[metric] === undefined) continue;
    const values = days.get(fact.day) ?? [];
    values.push(fact[metric]!);
    days.set(fact.day, values);
  }
  return lineDataFromEntries([...days].sort(([a], [b]) => a.localeCompare(b))
    .map(([day, values]) => [day, summarizeMetric(values)!.mean]), label, color);
};

const PerformanceTabs = ({ analytics, t }: Props) => {
  const facts = analytics.messageFacts.filter((fact) => fact.role === "assistant");
  const ttft = summarizeMetric(facts.map((fact) => fact.ttft));
  const tps = summarizeMetric(facts.map((fact) => fact.tps));
  const comparisons = (metric: "ttft" | "tps") => {
    const metricTitle = t(metric === "ttft" ? "timeToFirstToken" : "tokensPerSecond");
    const unit = metric === "ttft" ? "s" : "tok/s";
    const groups = new Map<string, { label: string; kind: "model" | "agent"; values: number[] }>();
    for (const fact of facts) {
      if (fact[metric] === undefined || !fact.entityKind || !fact.entityKey || !fact.entityLabel) continue;
      const key = `${fact.entityKind}:${fact.entityKey}`;
      const group = groups.get(key) ?? { label: fact.entityLabel, kind: fact.entityKind, values: [] };
      group.values.push(fact[metric]!);
      groups.set(key, group);
    }
    const rows = [...groups.values()].map((group) => ({ ...group, summary: summarizeMetric(group.values)! }))
      .sort((a, b) => b.summary.count - a.summary.count || a.label.localeCompare(b.label));
    return (
      <Section>
        <Grid>
          {(["model", "agent"] as const).map((kind) => {
            const items = rows.filter((row) => row.kind === kind).slice(0, 12);
            return <ChartCard key={kind} title={`${t(kind === "agent" ? "agents.title" : "models")} · ${metricTitle}`}
              type="bar" data={{ labels: items.map((row) => row.label), datasets: [{ label: `${t("ai.usage.average")} (${unit})`, data: items.map((row) => row.summary.mean), backgroundColor: kind === "agent" ? palette[1] : palette[0] }] }}
              options={horizontalBarOptions()} noDataDescription={noData(t)} />;
          })}
        </Grid>
        <UsageTable title={metricTitle} headers={[t("ai.usage.tabModelsAgents"), t("ai.usage.kind"), t("ai.usage.samples"), `${t("ai.usage.average")} (${unit})`, `${t("ai.usage.median")} (${unit})`, `P95 (${unit})`]}
          rows={rows.map((row) => [row.label, t(row.kind === "agent" ? "agent" : "model"), formatNumber(row.summary.count), formatMetric(row.summary.mean), formatMetric(row.summary.median), formatMetric(row.summary.p95)])} />
      </Section>
    );
  };
  const tabs: UsageTab[] = [
    {
      key: "summary", icon: "chart", title: t("ai.usage.summary"), render: () => (
        <Section>
          <Grid compact>
            <KpiCard title={t("ai.usage.averageTtft")} value={formatMetric(ttft?.mean, "s")} />
            <KpiCard title={t("ai.usage.p95Ttft")} value={formatMetric(ttft?.p95, "s")} />
            <KpiCard title={t("ai.usage.averageTps")} value={formatMetric(tps?.mean, "tok/s")} />
            <KpiCard title={t("ai.usage.measuredResponses")} value={formatNumber(facts.filter((fact) => fact.ttft !== undefined || fact.tps !== undefined).length)} />
          </Grid>
          <Grid>
            <ChartCard title={t("ai.usage.ttftOverTime")} type="line" data={metricTrends(facts, "ttft", `${t("timeToFirstToken")} (s)`, palette[0])} options={chartOptions()} noDataDescription={noData(t)} />
            <ChartCard title={t("ai.usage.tpsOverTime")} type="line" data={metricTrends(facts, "tps", `${t("tokensPerSecond")} (tok/s)`, palette[1])} options={chartOptions()} noDataDescription={noData(t)} />
          </Grid>
        </Section>
      ),
    },
    { key: "ttft", icon: "timeToFirstToken", title: t("timeToFirstToken"), render: () => comparisons("ttft") },
    { key: "tps", icon: "tokensPerSecond", title: t("tokensPerSecond"), render: () => comparisons("tps") },
  ];
  return <VerticalTabs tabs={tabs} />;
};

const ToolsTabs = ({ analytics, t }: Props) => {
  const tools = topToolStats(analytics.toolStats, 15);
  const tabs: UsageTab[] = [
    {
      key: "tools",
      icon: "tool",
      title: t("tools"),
      render: () => (
        <Section>
          <KpiCard title={t("ai.usage.messagesWithToolsLabel")} value={formatNumber(analytics.messagesWithTools)} />
          <ChartCard title={t("ai.usage.topTools")} type="bar" data={{ labels: tools.map((tool) => tool.label), datasets: [{ label: t("ai.usage.invocations"), data: tools.map((tool) => tool.count), backgroundColor: palette[3] }] }} options={horizontalBarOptions()} noDataDescription={noData(t)} />
        </Section>
      ),
    },
    {
      key: "states",
      icon: "completed",
      title: t("ai.usage.states"),
      render: () => (
        <Grid>
          <ChartCard title={t("ai.usage.toolStates")} type="doughnut" data={doughnutDataFromCounts(topCounts(analytics.toolStateCounts), t("ai.usage.invocations"))} noDataDescription={noData(t)} />
          <ChartCard title={t("ai.usage.toolSuccessByName")} type="bar" data={{ labels: tools.map((tool) => tool.label), datasets: [{ label: t("completed"), data: tools.map((tool) => tool.success), backgroundColor: palette[2] }, { label: t("warning"), data: tools.map((tool) => tool.error), backgroundColor: palette[5] }, { label: t("ai.usage.pending"), data: tools.map((tool) => tool.pending), backgroundColor: palette[4] }] }} options={{ ...horizontalBarOptions(), scales: { x: { stacked: true, beginAtZero: true }, y: { stacked: true } } }} noDataDescription={noData(t)} />
        </Grid>
      ),
    },
    {
      key: "results",
      icon: "toolResult",
      title: t("toolResult"),
      render: () => <ChartCard title={t("ai.usage.toolResultTypes")} type="bar" data={barDataFromCounts(topCounts(analytics.toolResultTypeCounts), t("ai.usage.results"))} options={horizontalBarOptions()} noDataDescription={noData(t)} />,
    },
  ];
  return <VerticalTabs tabs={tabs} />;
};

const contentTabs = ({ analytics, t }: Props): UsageTab[] => [
    {
      key: "parts",
      icon: "components",
      title: t("ai.usage.parts"),
      render: () => (
        <Grid compact>
          <KpiCard title={t("ai.usage.parts")} value={formatNumber(analytics.parts)} />
          <KpiCard title={t("ai.usage.textVolume")} value={`${formatCompact(analytics.textChars)} ${t("ai.usage.characters")}`} />
          <ChartCard title={t("ai.usage.partTypes")} type="bar" data={barDataFromCounts(topCounts(analytics.contentTypeCounts), t("ai.usage.parts"))} options={horizontalBarOptions()} noDataDescription={noData(t)} />
          <ChartCard title={t("ai.usage.sources")} type="doughnut" data={doughnutDataFromCounts(topCounts(analytics.sourceTypeCounts), t("sources"))} noDataDescription={noData(t)} />
        </Grid>
      ),
    },
    {
      key: "attachments",
      icon: "attachment",
      title: t("attachments"),
      render: () => <ChartCard title={t("ai.usage.attachmentTypes")} type="bar" data={barDataFromCounts(topCounts(analytics.attachmentTypeCounts), t("attachments"))} options={horizontalBarOptions()} noDataDescription={noData(t)} />,
    },
    {
      key: "rich",
      icon: "structuredOutputs",
      title: t("ai.usage.richParts"),
      render: () => (
        <Grid>
          <KpiCard title={t("reasoning")} value={formatNumber(analytics.messagesWithReasoning)} />
          <KpiCard title={t("dataParts")} value={formatNumber(analytics.messagesWithDataParts)} />
          <KpiCard title={t("sources")} value={formatNumber(analytics.messagesWithSources)} />
          <KpiCard title={t("structure")} value={formatNumber(analytics.messagesWithStructuredOutput)} />
        </Grid>
      ),
    },
  ];

const patternTabs = ({ analytics, t }: Props): UsageTab[] => [
    {
      key: "balance",
      icon: "personalization",
      title: t("ai.usage.balance"),
      render: () => (
        <ChartCard title={t("ai.usage.temperatureDistribution")} type="bar" data={barDataFromCounts(topCounts(analytics.temperatureCounts), t("temperature"))} options={chartOptions()} noDataDescription={noData(t)} />
      ),
    },
    {
      key: "finish",
      icon: "check",
      title: t("ai.usage.finish"),
      render: () => (
        <Grid>
          <ChartCard title={t("ai.usage.finishReasons")} type="bar" data={barDataFromCounts(topCounts(analytics.finishReasonCounts), t("ai.usage.messages"))} options={horizontalBarOptions()} noDataDescription={noData(t)} />
          <ChartCard title={t("ai.usage.errors")} type="bar" data={barDataFromCounts(topCounts(analytics.errorCounts), t("ai.usage.messages"))} options={horizontalBarOptions()} noDataDescription={noData(t)} />
        </Grid>
      ),
    },
  ];

const UsageTable = ({ title, headers, rows }: { title?: string; headers: string[]; rows: string[][] }) => {
  const { Card, Text, Button } = useTheme();
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(rows.length / 15));
  const current = Math.min(page, pages - 1);
  return (
    <Card title={title ?? headers[0]} size="small">
      {rows.length === 0 ? (
        <Text as="p" style={{ color: "inherit", margin: 0 }}>{t("ai.usage.noDataDescription")}</Text>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>{headers.map((header) => <th key={header} style={thStyle}>{header}</th>)}</tr>
            </thead>
            <tbody>
              {rows.slice(current * 15, (current + 1) * 15).map((row, rowIndex) => (
                <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex} style={{ ...tdStyle, overflowWrap: "anywhere" }}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
          {pages > 1 ? <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, marginTop: 12 }}>
            <Button size="small" variant="transparent" disabled={current === 0} onClick={() => setPage(current - 1)}>{t("ai.usage.previous")}</Button>
            <span>{current + 1} / {pages}</span>
            <Button size="small" variant="transparent" disabled={current + 1 >= pages} onClick={() => setPage(current + 1)}>{t("ai.usage.next")}</Button>
          </div> : null}
        </div>
      )}
    </Card>
  );
};

const VerticalTabs = ({ tabs }: { tabs: UsageTab[] }) => {
  const { Tabs, Tab } = useTheme();
  const [activeTab, setActiveTab] = useState(tabs[0]?.key ?? "");

  useEffect(() => {
    if (!tabs.some((tab) => tab.key === activeTab)) setActiveTab(tabs[0]?.key ?? "");
  }, [activeTab, tabs]);

  return (
    <Tabs activeKey={activeTab} vertical iconOnly onSelect={(k: string) => setActiveTab(k)} style={{ width: "100%", minWidth: 0 }}>
      {tabs.map((tab) => (
        <Tab key={tab.key} eventKey={tab.key} icon={tab.icon} title={tab.title}>
          <div style={{ width: "100%", minWidth: 0, paddingTop: 4 }}>{activeTab === tab.key ? tab.render() : null}</div>
        </Tab>
      ))}
    </Tabs>
  );
};

export const UsageAnalysisTabs = ({ analytics, t }: Props) => {
  const { Tabs, Tab } = useTheme();
  const tabs = useMemo(
    () => [
      { key: "overview", title: t("ai.usage.tabOverview"), component: OverviewTabs },
      { key: "models", title: t("ai.usage.tabModelsAgents"), component: ModelsProvidersTabs },
      { key: "tokens", title: t("ai.usage.tabUsage"), component: TokensCostTabs },
      { key: "performance", title: t("ai.usage.tabPerformance"), component: PerformanceTabs },
      { key: "tools", title: t("ai.usage.tabToolsMcp"), component: ToolsTabs },
    ],
    [t]
  );
  const [activeTab, setActiveTab] = useState(tabs[0].key);

  useEffect(() => {
    if (!tabs.some((tab) => tab.key === activeTab)) setActiveTab(tabs[0].key);
  }, [activeTab, tabs]);

  return (
    <Tabs activeKey={activeTab} style={{ width: "100%" }} onSelect={(k: string) => setActiveTab(k)}>
      {tabs.map((tab) => {
        const Component = tab.component;
        return (
          <Tab key={tab.key} eventKey={tab.key} title={tab.title}>
            <div style={{ width: "100%", minWidth: 0, paddingTop: 16 }}>
              {activeTab === tab.key ? <Component analytics={analytics} t={t} /> : null}
            </div>
          </Tab>
        );
      })}
    </Tabs>
  );
};

