import type { Meta, StoryObj } from "@storybook/react";
import { ToolInvocationCard } from "aihappey-components";
import type { Tool } from "aihappey-mcp";

const meta: Meta<typeof ToolInvocationCard> = {
  title: "Cards/ToolInvocationCard",
  component: ToolInvocationCard,
};

export default meta;
type Story = StoryObj<typeof ToolInvocationCard>;

const tool: Tool = {
  name: "demo-tool",
  title: "Demo Tool",
  inputSchema: {
    type: "object"
  },
  icons: [{ src: "https://placehold.co/32x32?text=T", theme: "light" }],
};

const providerIcons: Tool["icons"] = [
  { src: "https://placehold.co/32x32?text=AI", theme: "light" },
];

const baseInvocation = {
  type: "tool-demo-tool",
  toolCallId: "call-1",
  input: { query: "hello", limit: 3 },
};

/**
 * INPUT AVAILABLE
 */
export const InputAvailable: Story = {
  render: () => (
    <ToolInvocationCard
      invocation={{ ...baseInvocation, state: "input-available" }}
      tool={tool}
    />
  ),
};

/**
 * INPUT STREAMING
 */
export const InputStreaming: Story = {
  render: () => (
    <ToolInvocationCard
      invocation={{ ...baseInvocation, state: "input-streaming" }}
      tool={tool}
    />
  ),
};

/**
 * OUTPUT AVAILABLE — SUCCESS
 */
export const OutputAvailableSuccess: Story = {
  render: () => (
    <ToolInvocationCard
      invocation={{
        ...baseInvocation,
        state: "output-available",
        output: {
          isError: false,
          result: { ok: true, items: [1, 2, 3] },
        },
      }}
      tool={tool}
      onShowOutput={() => { }}
    />
  ),
};

/**
 * OUTPUT AVAILABLE — ERROR
 */
export const OutputAvailableError: Story = {
  render: () => (
    <ToolInvocationCard
      invocation={{
        ...baseInvocation,
        state: "output-available",
        output: {
          isError: true,
          message: "Something went wrong",
        },
      }}
      tool={tool}
      onShowOutput={() => { }}
    />
  ),
};

/**
 * OUTPUT ERROR STATE
 */
export const OutputError: Story = {
  render: () => (
    <ToolInvocationCard
      invocation={{ ...baseInvocation, state: "output-error" }}
      tool={tool}
    />
  ),
};

/**
 * WITHOUT TOOL — title derived from invocation.type
 */
export const WithoutToolUsesInvocationTypeForTitle: Story = {
  render: () => (
    <ToolInvocationCard
      invocation={{ ...baseInvocation, type: "tool-custom" }}
    />
  ),
};

/**
 * PROVIDER EXECUTED — provider icon without MCP tool metadata
 */
export const ProviderExecutedWithProviderIcon: Story = {
  render: () => (
    <ToolInvocationCard
      invocation={{ ...baseInvocation, type: "tool-search", state: "output-available", providerExecuted: true }}
      providerIcons={providerIcons}
    />
  ),
};

/**
 * PROVIDER EXECUTED — no provider icon available should remain safe
 */
export const ProviderExecutedWithoutProviderIcon: Story = {
  render: () => (
    <ToolInvocationCard
      invocation={{ ...baseInvocation, type: "tool-search", state: "output-available", providerExecuted: true }}
    />
  ),
};

/**
 * WITH EXPLAIN TOOL
 */
export const WithExplainTool: Story = {
  render: () => {
    const getToolExplanation = async (invocation: any) =>
      `Explaining ${invocation.type}:\nThis tool searches for relevant data.`;

    const renderToolExplanation = (text: string) => (
      <div style={{ whiteSpace: "pre-wrap" }}>{text}</div>
    );

    return (
      <ToolInvocationCard
        invocation={{ ...baseInvocation, state: "input-available" }}
        tool={tool}
        getToolExplanation={getToolExplanation}
        renderToolExplanation={renderToolExplanation}
      />
    );
  },
};
