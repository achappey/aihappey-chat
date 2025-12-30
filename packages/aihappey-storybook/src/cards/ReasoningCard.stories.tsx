import type { Meta, StoryObj } from "@storybook/react";
import type { ReasoningUIPart } from "aihappey-ai";
import { ReasoningCard } from "aihappey-components";

const meta = {
  title: "Cards/ReasoningCard",
  component: ReasoningCard,
} satisfies Meta<typeof ReasoningCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const block =
  ({
    type: "reasoning",
    text: "This is a detailed reasoning process explaining the steps taken to arrive at the answer.\n\n1. Step one\n2. Step two",
  } as unknown as ReasoningUIPart);

export const Default: Story = {
  args: {
    block,
  },
};

export const WithMarkdown: Story = {
  args: {
    block,
    renderText: (text) => <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{text}</pre>,
  },
};

