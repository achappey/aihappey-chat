import type { Meta, StoryObj } from "@storybook/react";
import type { RerankingResponse } from "aihappey-ai";
import { RerankingCard } from "aihappey-components";

const OPENROUTER_ICON_DATA_URI = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='8' fill='%230f172a'/%3E%3Ctext x='20' y='25' text-anchor='middle' font-size='13' font-family='Arial' fill='white'%3EOR%3C/text%3E%3C/svg%3E";

const providers = {
  openrouter: {
    name: "OpenRouter",
    icons: [{ src: OPENROUTER_ICON_DATA_URI }],
    urls: { homepage: "https://openrouter.ai" },
  },
};

const files = [
  {
    name: "support-ticket-1421.txt",
    text:
      "User reports intermittent login failures. Observed: 500 responses on /auth/token.\n\nSteps tried:\n- Clear cache\n- Reset password\n\nRelevant log snippet:\nERROR auth-service: token exchange failed",
  },
  {
    name: "incident-postmortem.md",
    text:
      "# Postmortem\n\nRoot cause: misconfigured rate limit on the token exchange endpoint.\n\nMitigation:\n- Rolled back config\n- Added dashboards and alerts\n\nFollow-up actions:\n- Add canary checks\n- Document rollout steps",
  },
  {
    name: "pricing-faq.md",
    text:
      "## Pricing FAQ\n\nQ: Do you offer annual billing?\nA: Yes.\n\nQ: How do refunds work?\nA: Refunds are evaluated case-by-case.",
  },
  {
    name: "auth-service-config.yaml",
    text:
      "rateLimit:\n  enabled: true\n  requestsPerMinute: 60\n\nupstream:\n  tokenExchangeTimeoutMs: 5000\n",
  },
];

const rerankingReranked = {
  providerMetadata: {
    gateway: { cost: 0.002 },
    openrouter: { usage: { search_units: 1, cost: 0.002 } },
  },
  response: {
    modelId: "openrouter/rerank-v1",
    timestamp: new Date("2026-01-10T10:11:12.000Z").getTime(),
  },
  ranking: [
    { index: 3, relevanceScore: 0.9823 },
    { index: 0, relevanceScore: 0.9411 },
    { index: 1, relevanceScore: 0.9032 },
    { index: 2, relevanceScore: 0.1027 },
  ],
} as unknown as RerankingResponse;

const rerankingBefore = {
  response: {
    modelId: "",
  },
  ranking: [],
} as unknown as RerankingResponse;

const meta = {
  title: "Cards/RerankingCard",
  component: RerankingCard,
  args: {
    query: "Find the most relevant documents about token exchange failures",
    files,
  },
} satisfies Meta<typeof RerankingCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultReranked: Story = {
  args: {
    providers,
    reranking: rerankingReranked,
    onDelete: () => console.log("RerankingCard: delete"),
  },
};

export const WithModelPrefixProviderFallback: Story = {
  args: {
    providers,
    reranking: {
      ...rerankingReranked,
      providerMetadata: {
        gateway: { cost: 0.002 },
      },
    } as unknown as RerankingResponse,
    onDelete: () => console.log("RerankingCard: delete"),
  },
};

export const MinimalBeforeRerank: Story = {
  args: {
    reranking: rerankingBefore,
  },
};

