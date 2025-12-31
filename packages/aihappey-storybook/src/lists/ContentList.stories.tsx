import type { Meta, StoryObj } from "@storybook/react";
import { ContentList } from "aihappey-components";
import type { UIMessagePart, ToolUIPart } from "aihappey-ai";

const meta: Meta<typeof ContentList> = {
  title: "Lists/ContentList",
  component: ContentList,
};

export default meta;
type Story = StoryObj<typeof ContentList>;

const renderMarkdown = (text: string) => <div>{text}</div>;

const textContent: UIMessagePart<any, any> = {
  type: "text",
  text: "Hello, this is a text message.",
};

const reasoningContent: UIMessagePart<any, any> = {
  type: "reasoning",
  text:
    "This is the reasoning process that explains how we arrived at the conclusion.",
};

const toolInvocationContent: ToolUIPart = {
  type: "tool-get_weather",
  toolCallId: "call_1",
  input: { location: "Amsterdam" },
  state: "output-available",
  output: { temperature: 20 },
};

const mixedContent: UIMessagePart<any, any>[] = [
  textContent,
  reasoningContent,
  toolInvocationContent,
  { type: "text", text: "And here is some final text." },
];

/**
 * TEXT ONLY
 */
export const TextOnly: Story = {
  render: () => (
    <ContentList
      content={[textContent, { type: "text", text: "Another paragraph." }]}
      onRenderMarkdown={renderMarkdown}
    />
  ),
};

/**
 * REASONING ONLY
 */
export const Reasoning: Story = {
  render: () => (
    <ContentList
      content={[reasoningContent]}
      onRenderMarkdown={renderMarkdown}
    />
  ),
};

/**
 * TOOL INTERACTION
 */
export const ToolInteraction: Story = {
  render: () => (
    <ContentList
      content={[toolInvocationContent]}
      onRenderMarkdown={renderMarkdown}
      onShowToolCallResult={(toolCall) =>
        console.log("Show tool call", toolCall)
      }
    />
  ),
};

/**
 * MIXED CONTENT
 */
export const MixedContent: Story = {
  render: () => (
    <ContentList
      content={mixedContent}
      onRenderMarkdown={renderMarkdown}
      onShowToolCallResult={(toolCall) =>
        console.log("Show tool call", toolCall)
      }
    />
  ),
};
