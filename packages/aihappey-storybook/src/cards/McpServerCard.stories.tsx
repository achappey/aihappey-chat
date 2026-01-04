import type { Meta, StoryObj } from "@storybook/react";
import type { McpRegistryServerResponse, ServerClientConfig } from "aihappey-types";
import { McpServerCard } from "aihappey-components";

const meta = {
  title: "Cards/McpServerCard",
  component: McpServerCard,
} satisfies Meta<typeof McpServerCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseConfig: ServerClientConfig = {
  type: "http",
  url: "https://api.example.com/mcp",
};

const fullRegistryItem: McpRegistryServerResponse = {
  server: {
    name: "example-mcp",
    title: "Example MCP Server",
    description: "Example description for an MCP server shown inside a card.",
    websiteUrl: "https://example.com",
    version: "1.0.0",
    repository: { url: "https://github.com/example/example-mcp" },
    icons: [
      { src: "https://placehold.co/32x32?text=L", theme: "light" },
      { src: "https://placehold.co/32x32/111/fff?text=D", theme: "dark" },
    ],
  },
  _meta: {},
};

export const Minimal: Story = {
  args: {
    serverName: "minimal-server",
    serverConfig: baseConfig,
    checked: false,
  },
};

export const WithRegistryItem: Story = {
  args: {
    serverName: "example-mcp",
    serverConfig: baseConfig,
    checked: true,
    registryItem: fullRegistryItem,
  },
};

export const WithToggleAndRemove: Story = {
  args: {
    serverName: "togglable-server",
    serverConfig: baseConfig,
    checked: true,
    registryItem: fullRegistryItem,
    onToggle: () => {},
    onRemove: () => {},
  },
};

export const CustomHeaderDescription: Story = {
  args: {
    serverName: "custom-description-server",
    serverConfig: baseConfig,
    checked: false,
    registryItem: fullRegistryItem,
    renderDescription: () => <strong>Owned by: Example</strong>,
  },
};

