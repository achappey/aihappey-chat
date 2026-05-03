import { JSX, useEffect, useMemo, useState } from "react";
import { useTheme } from "aihappey-components";
import type { IconToken } from "aihappey-types";
import type { UsageAnalytics } from "./usageAnalytics";
import {
  sortedMapEntries,
  topCounts,
  topModelStats,
  topProviderStats,
  topToolStats,
} from "./usageAnalytics";
import {
  ChartCard,
  Grid,
  KpiCard,
  Section,
  chartOptions,
  formatCompact,
  formatCurrency,
  formatNumber,
  horizontalBarOptions,
  palette,
  srOnly,
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
  return barDataFromCounts(topCounts(buckets, 10), "Conversations");
};

const OverviewTabs = ({ analytics, t }: Props) => {
  const tabs: UsageTab[] = [
    {
      key: "summary",
      icon: "chart",
      title: t("ai.usage.summary"),
      render: () => (
        <Section>
          <Grid>
            <KpiCard title={t("ai.usage.conversations")} value={formatNumber(analytics.conversations)} />
            <KpiCard title={t("ai.usage.messages")} value={formatNumber(analytics.messages)} />
            <KpiCard title={t("ai.usage.parts")} value={formatNumber(analytics.parts)} />
            <KpiCard title={t("ai.usage.textVolume")} value={formatCompact(analytics.textChars)} description={t("ai.usage.characters")} />
            <KpiCard title={t("ai.usage.totalTokens")} value={formatCompact(analytics.tokenTotals.total)} description={t("ai.usage.messagesWithUsage", { total: analytics.tokenTotals.messagesWithUsage })} />
            <KpiCard title={t("ai.usage.estimatedCost")} value={formatCurrency(analytics.totalCost)} description={t("ai.usage.messagesWithCost", { total: analytics.messagesWithCost })} />
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
      render: () => (
        <Grid>
          <ChartCard title={t("ai.usage.topModels")} type="bar" data={{ labels: models.map((m) => m.label), datasets: [{ label: t("ai.usage.messages"), data: models.map((m) => m.count), backgroundColor: palette[0] }] }} options={horizontalBarOptions()} noDataDescription={noData(t)} />
          <ChartCard title={t("ai.usage.modelTokens")} type="bar" data={{ labels: models.map((m) => m.label), datasets: [{ label: t("ai.usage.tokens"), data: models.map((m) => m.tokens), backgroundColor: palette[2] }] }} options={horizontalBarOptions()} noDataDescription={noData(t)} />
        </Grid>
      ),
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
            analytics.messageFacts.filter((fact) => fact.modelLabel === modelLabel && fact.providerLabel === providerLabel).length
          ),
          backgroundColor: palette[modelLabels.indexOf(modelLabel) % palette.length],
        }));
        return <ChartCard title={t("ai.usage.providerModelMatrix")} type="bar" data={{ labels: providerLabels, datasets: matrix }} options={{ ...chartOptions(), scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } } }} noDataDescription={noData(t)} />;
      },
    },
    {
      key: "legacy",
      icon: "warning",
      title: t("ai.usage.legacy"),
      render: () => (
        <Section>
          <Grid>
            <KpiCard title={t("ai.usage.legacyModelMessages")} value={formatNumber(analytics.legacyModelMessages)} description={t("ai.usage.legacyDescription")} />
            <KpiCard title={t("ai.usage.unknownProviderMessages")} value={formatNumber(analytics.unknownProviderMessages)} description={t("ai.usage.unknownProviderDescription")} />
          </Grid>
          <UsageTable rows={models.filter((m) => m.legacy || m.unknownProvider).map((m) => [m.label, m.providerLabel, formatNumber(m.count), formatCompact(m.tokens)])} headers={[t("model"), t("providers"), t("ai.usage.messages"), t("ai.usage.tokens")]} />
        </Section>
      ),
    },
  ];
  return <VerticalTabs tabs={tabs} />;
};

const TokensCostTabs = ({ analytics, t }: Props) => {
  const outliers = [...analytics.messageFacts].sort((a, b) => b.tokens - a.tokens).slice(0, 12);
  const costOutliers = [...analytics.messageFacts].sort((a, b) => b.cost - a.cost).slice(0, 12);
  const tabs: UsageTab[] = [
    {
      key: "tokens",
      icon: "maxOutputTokens",
      title: t("ai.usage.tokens"),
      render: () => (
        <Section>
          <Grid>
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
        <Grid>
          <KpiCard title={t("ai.usage.estimatedCost")} value={formatCurrency(analytics.totalCost)} />
          <ChartCard title={t("ai.usage.dailyCost")} type="line" data={lineDataFromEntries(sortedMapEntries(analytics.dailyCost), t("ai.usage.cost"), palette[5])} options={chartOptions()} noDataDescription={noData(t)} />
          <ChartCard title={t("ai.usage.topConversationsByCost")} type="bar" data={topConversationData(analytics, "cost")} options={horizontalBarOptions()} noDataDescription={noData(t)} />
        </Grid>
      ),
    },
    {
      key: "outliers",
      icon: "trending",
      title: t("ai.usage.outliers"),
      render: () => (
        <Section>
          <UsageTable headers={[t("title"), t("ai.usage.role"), t("ai.usage.tokens"), t("ai.usage.cost"), t("model")]} rows={outliers.map((fact) => [fact.conversationName, fact.role, formatCompact(fact.tokens), formatCurrency(fact.cost), fact.modelLabel ?? "-"])} />
          <UsageTable headers={[t("title"), t("ai.usage.role"), t("ai.usage.cost"), t("ai.usage.tokens"), t("model")]} rows={costOutliers.map((fact) => [fact.conversationName, fact.role, formatCurrency(fact.cost), formatCompact(fact.tokens), fact.modelLabel ?? "-"])} />
        </Section>
      ),
    },
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
        <Grid>
          <KpiCard title={t("ai.usage.messagesWithToolsLabel")} value={formatNumber(analytics.messagesWithTools)} />
          <ChartCard title={t("ai.usage.topTools")} type="bar" data={{ labels: tools.map((tool) => tool.label), datasets: [{ label: t("ai.usage.invocations"), data: tools.map((tool) => tool.count), backgroundColor: palette[3] }] }} options={horizontalBarOptions()} noDataDescription={noData(t)} />
        </Grid>
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

const ContentTabs = ({ analytics, t }: Props) => {
  const tabs: UsageTab[] = [
    {
      key: "parts",
      icon: "components",
      title: t("ai.usage.parts"),
      render: () => (
        <Grid>
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
  return <VerticalTabs tabs={tabs} />;
};

const PatternsTabs = ({ analytics, t }: Props) => {
  const tabs: UsageTab[] = [
    {
      key: "balance",
      icon: "personalization",
      title: t("ai.usage.balance"),
      render: () => (
        <Grid>
          <ChartCard title={t("ai.usage.roleMix")} type="doughnut" data={doughnutDataFromCounts(topCounts(analytics.roleCounts), t("ai.usage.messages"))} noDataDescription={noData(t)} />
          <ChartCard title={t("ai.usage.temperatureDistribution")} type="bar" data={barDataFromCounts(topCounts(analytics.temperatureCounts), t("temperature"))} options={chartOptions()} noDataDescription={noData(t)} />
        </Grid>
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
    {
      key: "depth",
      icon: "table",
      title: t("ai.usage.depth"),
      render: () => <ChartCard title={t("ai.usage.topConversationsByMessages")} type="bar" data={topConversationData(analytics, "messageCount")} options={horizontalBarOptions()} noDataDescription={noData(t)} />,
    },
  ];
  return <VerticalTabs tabs={tabs} />;
};

const UsageTable = ({ headers, rows }: { headers: string[]; rows: string[][] }) => {
  const { Card, Text } = useTheme();
  return (
    <Card title={headers[0]} size="small">
      {rows.length === 0 ? (
        <Text as="p" style={{ color: "#777", margin: 0 }}>No rows</Text>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>{headers.map((header) => <th key={header} style={thStyle}>{header}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex} style={tdStyle}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
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
    <Tabs activeKey={activeTab} vertical onSelect={(k: string) => setActiveTab(k)} style={{ width: "100%", minHeight: 420 }}>
      {tabs.map((tab) => (
        <Tab key={tab.key} eventKey={tab.key} icon={tab.icon as any} title={<span style={srOnly}>{tab.title}</span>}>
          <div style={{ width: "100%", paddingTop: 4 }}>{activeTab === tab.key ? tab.render() : null}</div>
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
      { key: "models", title: t("ai.usage.tabModelsProviders"), component: ModelsProvidersTabs },
      { key: "tokens", title: t("ai.usage.tabTokensCost"), component: TokensCostTabs },
      { key: "tools", title: t("ai.usage.tabToolsMcp"), component: ToolsTabs },
      { key: "content", title: t("ai.usage.tabContent"), component: ContentTabs },
      { key: "patterns", title: t("ai.usage.tabPatterns"), component: PatternsTabs },
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
            <div style={{ width: "100%", maxWidth: 980, paddingTop: 12 }}>
              {activeTab === tab.key ? <Component analytics={analytics} t={t} /> : null}
            </div>
          </Tab>
        );
      })}
    </Tabs>
  );
};

