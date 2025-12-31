import type { Meta, StoryObj } from "@storybook/react";
import { UIMessagePartCard } from "aihappey-components";
import type { UIMessagePart, ToolUIPart } from "aihappey-ai";

const meta: Meta<typeof UIMessagePartCard> = {
  title: "Cards/UIMessagePartCard",
  component: UIMessagePartCard,
};

export default meta;
type Story = StoryObj<typeof UIMessagePartCard>;

const renderMarkdown = (text: string) => <div>{text}</div>;

const textContent: UIMessagePart<any, any> = {
  type: "text",
  text: "Hello, this is a text message.",
};

const reasoningContent: UIMessagePart<any, any> = {
  type: "reasoning",
  text: "This is the reasoning process...",
};

const toolInvocationContent: ToolUIPart = {
  type: "tool-get_weather",
  toolCallId: "call_1",
  input: { location: "Amsterdam" },
  state: "output-available",
  output: { temperature: 20 },
};

/**
 * TEXT
 */
export const Text: Story = {
  render: () => (
    <UIMessagePartCard
      content={textContent}
      onRenderMarkdown={renderMarkdown}
    />
  ),
};

/**
 * REASONING
 */
export const Reasoning: Story = {
  render: () => (
    <UIMessagePartCard
      content={reasoningContent}
      onRenderMarkdown={renderMarkdown}
    />
  ),
};

/**
 * TOOL INVOCATION
 */
export const ToolInvocation: Story = {
  render: () => (
    <UIMessagePartCard
      content={toolInvocationContent}
      onRenderMarkdown={renderMarkdown}
      onShowToolCallResult={(toolCall) =>
        console.log("Show tool call", toolCall)
      }
    />
  ),
};
