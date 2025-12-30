import type { Meta, StoryObj } from "@storybook/react";
import type { ModelOption } from "aihappey-types";
import { ModelCard } from "aihappey-components";

const meta = {
  title: "Cards/ModelCard",
  component: ModelCard,
} satisfies Meta<typeof ModelCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const languageModel: ModelOption = {
  id: "gpt-4o-mini",
  name: "GPT-4o mini",
  type: "language",
  owned_by: "OpenAI",
  description: "A small, fast language model option for chat experiences.",
  tags: ["language", "chat", "fast"],
};

const embeddingModel: ModelOption = {
  id: "text-embedding-3-small",
  name: "Text Embedding 3 (small)",
  type: "embedding",
  owned_by: "OpenAI",
  description: "Embedding model example (no chat action expected).",
  tags: ["embedding"],
};

export const LanguageDefault: Story = {
  args: {
    model: languageModel,
  },
};

export const LanguageWithImage: Story = {
  args: {
    model: languageModel,
    image: "https://placehold.co/32x32?text=AI",
  },
};

export const LanguageWithChatAction: Story = {
  args: {
    model: languageModel,
    image: "https://placehold.co/32x32?text=AI",
    onChat: () => {},
  },
};

export const NonLanguageNoChat: Story = {
  args: {
    model: embeddingModel,
    onChat: () => {},
  },
};

