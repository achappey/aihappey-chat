import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type { RerankingResponse } from "aihappey-ai";
import { RerankingModal } from "aihappey-components";

const files = [
  { name: "support-ticket-1421.txt" },
  { name: "incident-postmortem.md" },
  { name: "pricing-faq.md" },
  { name: "auth-service-config.yaml" },
];

const reranking: RerankingResponse = {
  response: {
    modelId: "rerank-v1",
    timestamp: new Date("2026-01-10T10:11:12.000Z").getTime() as any,
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

