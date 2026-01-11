import type { Meta, StoryObj } from "@storybook/react";
import type { RerankingResponse } from "aihappey-ai";
import { RerankingCard } from "aihappey-components";

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
  response: {
    modelId: "rerank-v1",
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
    reranking: rerankingReranked,
    onDelete: () => console.log("RerankingCard: delete"),
  },
};

export const MinimalBeforeRerank: Story = {
  args: {
    reranking: rerankingBefore,
  },
};

