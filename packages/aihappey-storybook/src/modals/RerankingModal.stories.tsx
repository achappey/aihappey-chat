import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type { RerankingResponse } from "aihappey-ai";
import { RerankingModal } from "aihappey-components";

const providers = {
  openrouter: {
    name: "OpenRouter",
    urls: { homepage: "https://openrouter.ai" },
  },
};

const files = [
  { name: "support-ticket-1421.txt" },
  { name: "incident-postmortem.md" },
  { name: "pricing-faq.md" },
  { name: "auth-service-config.yaml" },
];

const reranking: RerankingResponse = {
  providerMetadata: {
    openrouter: { usage: { search_units: 1 } },
  },
  response: {
    modelId: "openrouter/rerank-v1",
    id: "rerank-resp-123",
    timestamp: new Date("2026-01-10T10:11:12.000Z").getTime() as any,
    headers: {
      "x-request-id": "rerank-req-123",
      "content-type": "application/json",
    },
    body: {
      results: [
        { index: 3, relevance_score: 0.9823 },
        { index: 0, relevance_score: 0.9411 },
      ],
    },
  },
  ranking: [
    { index: 3, relevanceScore: 0.9823 },
    { index: 0, relevanceScore: 0.9411 },
    { index: 1, relevanceScore: 0.9032 },
    { index: 2, relevanceScore: 0.1027 },
  ],
} as any;

type ControlledProps = Omit<
  React.ComponentProps<typeof RerankingModal>,
  "open" | "onClose"
> & {
  initialOpen: boolean;
};

const Controlled: React.FC<ControlledProps> = ({ initialOpen, ...args }) => {
  const [open, setOpen] = useState(initialOpen);
  return <RerankingModal {...args} open={open} onClose={() => setOpen(false)} />;
};

const meta = {
  title: "Modals/RerankingModal",
  component: RerankingModal,
  args: {
    open: true,
    onClose: (() => {}) as any,
    query: "Find the most relevant documents about token exchange failures",
    files,
    reranking,
    providers,
    size: "large",
  },
  argTypes: {
    open: { control: false },
    onClose: { action: "close", control: false },
    query: { control: "text" },
    files: { control: "object" },
    reranking: { control: "object" },
    size: { control: "radio", options: ["small", "medium", "large"] },
  },
} satisfies Meta<typeof RerankingModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    initialOpen: true,
  } as any,
  render: (args) => <Controlled {...(args as any)} />,
};

