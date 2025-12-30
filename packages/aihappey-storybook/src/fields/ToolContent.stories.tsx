import type { Meta, StoryObj } from "@storybook/react";
import type { ProgressNotificationParams, Tool } from "@modelcontextprotocol/sdk/types.js";
import { ToolContent } from "aihappey-components";

const meta = {
  title: "Fields/ToolContent",
  component: ToolContent,
} satisfies Meta<typeof ToolContent>;

export default meta;
type Story = StoryObj<typeof meta>;

const simpleInvocation: React.ComponentProps<typeof ToolContent>["invocation"] = {
  type: "tool-call",
  toolCallId: "call_1",
  input: { location: "Amsterdam" },
};

const complexInvocation: React.ComponentProps<typeof ToolContent>["invocation"] = {
  type: "tool-call",
  toolCallId: "call_2",
  input: {
    query: "SELECT * FROM users",
    database: "production",
    options: {
      timeout: 5000,
    },
  },
};

const toolDefinition = {
  name: "get_weather",
  title: "Get weather",
  description: "Get weather for a location",
  // The SDK Tool type may require more fields depending on version.
  // This cast keeps the story resilient while still being runtime-correct for ToolContent.
  inputSchema: { type: "object", properties: {} },
} as unknown as Tool;

const progress: ProgressNotificationParams = {
  progressToken: "progress_1",
  progress: 0.4,
  total: 1,
  message: "Fetching…",
};

export const Simple: Story = {
  args: {
    invocation: simpleInvocation,
  },
};

export const Complex: Story = {
  args: {
    invocation: complexInvocation,
  },
};

export const WithToolDefinition: Story = {
  args: {
    invocation: simpleInvocation,
    tool: toolDefinition,
  },
};

export const WithProgress: Story = {
  args: {
    invocation: simpleInvocation,
    tool: toolDefinition,
    progress,
  },
};

