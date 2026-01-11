import type { Meta, StoryObj } from "@storybook/react";
import { RerankingDocumentCard } from "aihappey-components";

const meta = {
  title: "Cards/RerankingDocumentCard",
  component: RerankingDocumentCard,
} satisfies Meta<typeof RerankingDocumentCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultReranked: Story = {
  args: {
    fileName: "incident-postmortem.md",
    rank: 1,
    relevanceScore: 0.9032,
    text:
      "# Postmortem\n\nRoot cause: misconfigured rate limit on the token exchange endpoint.\n\nMitigation:\n- Rolled back config\n- Added dashboards and alerts\n\nFollow-up actions:\n- Add canary checks\n- Document rollout steps",
    onDownload: () => console.log("RerankingDocumentCard: download"),
  },
};

export const MinimalBeforeRerank: Story = {
  args: {
    fileName: "pricing-faq.md",
    text:
      "## Pricing FAQ\n\nQ: Do you offer annual billing?\nA: Yes.\n\nQ: How do refunds work?\nA: Refunds are evaluated case-by-case.",
  },
};

