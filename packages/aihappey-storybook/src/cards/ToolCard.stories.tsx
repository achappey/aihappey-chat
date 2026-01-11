import type { Meta, StoryObj } from "@storybook/react";

import { ToolCard } from "aihappey-components";

const meta: Meta<typeof ToolCard> = {
  title: "cards/ToolCard",
  component: ToolCard,
};

export default meta;

type Story = StoryObj<typeof ToolCard>;

export const Default: Story = {
  args: {
    id: "tool:demo",
    name: "local_file_list",
    title: "List local files",
    description:
      "Lists files available in local storage. Use this when you need to inspect the local workspace artifacts.",
    source: "plugin",
    sourceDetail: "local-files",
    enabled: true,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
    inputSchema: {
      type: "object",
      properties: {
        glob: { type: "string", description: "Optional glob pattern" },
        limit: { type: "number", description: "Max number of files" },
      },
      required: [],
    },
  },
};

export const CustomToolWithCode: Story = {
  args: {
    id: "tool:custom:demo",
    name: "my_custom_tool",
    title: "My custom tool",
    description: "A locally defined custom tool with editable JavaScript execute code.",
    source: "local",
    sourceDetail: "Custom tools",
    enabled: true,
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string" },
      },
      required: ["message"],
    },
    executeSource: "async ({ message }) => {\n  return { ok: true, echo: message };\n}",
  },
};

