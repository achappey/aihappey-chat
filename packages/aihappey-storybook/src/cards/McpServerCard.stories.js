import React from "react";
import { McpServerCard } from "aihappey-components";

export default {
  title: "Cards/McpServerCard",
  component: McpServerCard,
};

const baseConfig = {
  url: "https://api.example.com/mcp",
};

const fullRegistryItem = {
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

export const Minimal = () =>
  React.createElement(McpServerCard, {
    serverName: "minimal-server",
    serverConfig: baseConfig,
    checked: false,
  });

export const WithRegistryItem = () =>
  React.createElement(McpServerCard, {
    serverName: "example-mcp",
    serverConfig: baseConfig,
    checked: true,
    registryItem: fullRegistryItem,
  });

export const WithToggleAndRemove = () =>
  React.createElement(McpServerCard, {
    serverName: "togglable-server",
    serverConfig: baseConfig,
    checked: true,
    registryItem: fullRegistryItem,
    onToggle: () => {},
    onRemove: () => {},
    translations: {
      delete: "Delete",
      sourceCode: "Source code",
      website: "Website",
    },
  });

export const CustomHeaderDescription = () =>
  React.createElement(McpServerCard, {
    serverName: "custom-description-server",
    serverConfig: baseConfig,
    checked: false,
    registryItem: fullRegistryItem,
    renderDescription: () => React.createElement("strong", null, "Owned by: Example"),
  });