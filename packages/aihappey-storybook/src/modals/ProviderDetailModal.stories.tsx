import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type { ModelOption, Provider } from "aihappey-types";
import { ProviderDetailModal } from "aihappey-components";

const SAMPLE_PROVIDER: Provider = {
  name: "OpenAI",
  description: "General-purpose AI provider",
  experimental: false,
  icons: [],
};

const SAMPLE_MODELS: ModelOption[] = [
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    type: "language",
    owned_by: "openai",
    tags: [],
    description: "Multimodal flagship model",
  },
  {
    id: "openai/gpt-image-1",
    name: "GPT Image 1",
    type: "image",
    owned_by: "openai",
    tags: [],
    description: "Image generation model",
  },
  {
    id: "other/not-in-provider",
    name: "Other Provider Model",
    type: "language",
    owned_by: "other",
    tags: [],
  },
];

type ControlledProps = Omit<
  React.ComponentProps<typeof ProviderDetailModal>,
  "open" | "onClose"
> & {
  initialOpen: boolean;
};

const Controlled: React.FC<ControlledProps> = ({ initialOpen, ...args }) => {
  const [open, setOpen] = useState(initialOpen);
  return <ProviderDetailModal {...args} open={open} onClose={() => setOpen(false)} />;
};

const meta = {
  title: "Modals/ProviderDetailModal",
  component: ProviderDetailModal,
  args: {
    open: true,
    onClose: (() => { }) as any,
    providerKey: "openai",
    providerName: "OpenAI",
    providerDescription: "General-purpose AI provider",
    providerImage: "https://placehold.co/40x40?text=AI",
    providerExperimental: false,
    modelTypes: ["language", "image"],
    models: SAMPLE_MODELS,
    provider: SAMPLE_PROVIDER,
    size: "large",
  },
  argTypes: {
    open: { control: false },
    onClose: { action: "close", control: false },
    providerKey: { control: "text" },
    providerName: { control: "text" },
    providerDescription: { control: "text" },
    providerImage: { control: "text" },
    providerExperimental: { control: "boolean" },
    modelTypes: { control: "object" },
    models: { control: "object" },
    provider: { control: "object" },
    size: { control: "radio", options: ["small", "medium", "large"] },
  },
} satisfies Meta<typeof ProviderDetailModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    initialOpen: true,
  } as any,
  render: (args) => <Controlled {...(args as any)} />,
};

export const NoModels: Story = {
  args: {
    initialOpen: true,
    modelTypes: [],
    models: [],
  } as any,
  render: (args) => <Controlled {...(args as any)} />,
};

export const IgnoresUnavailableModelTypes: Story = {
  args: {
    initialOpen: true,
    providerKey: "zeroentropy",
    providerName: "ZeroEntropy",
    providerDescription:
      "ZeroEntropy trains small, specialized AI models — state-of-the-art rerankers, embeddings, and custom-trained models for production AI systems.",
    modelTypes: ["language", "reranking"],
    models: [
      {
        id: "zeroentropy/zerank-1",
        name: "ZeRank 1",
        type: "reranking",
        owned_by: "zeroentropy",
        tags: [],
        description: "Reranking model",
      },
    ],
  } as any,
  render: (args) => <Controlled {...(args as any)} />,
};
