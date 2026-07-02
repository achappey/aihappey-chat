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

export const WithMarkdownParagraphs: Story = {
  args: {
    block: {
      ...block,
      text: "Considering user language preference\n\nI need to respond in the user's preferred language. The developer instructions mention always using English, but the user greeted me in Dutch, so the greeting should match their context.",
    } as ReasoningUIPart,
    renderText: (text) => (
      <div>
        <p style={{ margin: "0 0 0.5em" }}>
          <strong>{text.split("\n\n")[0]}</strong>
        </p>
        <p style={{ margin: 0 }}>{text.split("\n\n")[1]}</p>
      </div>
    ),
  },
};
