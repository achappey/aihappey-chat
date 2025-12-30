import type { Meta, StoryObj } from "@storybook/react";
import { McpServerCardButtons } from "aihappey-components";

const meta = {
  title: "Buttons/McpServerCardButtons",
  component: McpServerCardButtons,
} satisfies Meta<typeof McpServerCardButtons>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CopyOnly: Story = {
  args: {
    url: "https://api.example.com/mcp",
  },
};

export const WithDelete: Story = {
  args: {
    url: "https://api.example.com/mcp",
    onDelete: () => console.log("Delete clicked"),
    translations: { delete: "Delete" },
  },
};

export const WithRepositoryAndWebsite: Story = {
  args: {
    url: "https://api.example.com/mcp",
    // Note: component prop is spelled `respositoryUrl` in the implementation.
    respositoryUrl: "https://github.com/example/example-mcp-server",
    websiteUrl: "https://example.com",
    translations: {
      sourceCode: "Source code",
      website: "Website",
    },
  },
};

export const Full: Story = {
  args: {
    url: "https://api.example.com/mcp",
    onDelete: () => console.log("Delete clicked"),
    respositoryUrl: "https://github.com/example/example-mcp-server",
    websiteUrl: "https://example.com",
    translations: {
      delete: "Delete",
      sourceCode: "Source code",
      website: "Website",
    },
  },
};

