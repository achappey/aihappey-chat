import React from "react";
import { McpServerCardButtons } from "aihappey-components";

export default {
  title: "Buttons/McpServerCardButtons",
  component: McpServerCardButtons,
};

export const CopyOnly = () =>
  React.createElement(McpServerCardButtons, {
    url: "https://api.example.com/mcp",
  });

export const WithDelete = () =>
  React.createElement(McpServerCardButtons, {
    url: "https://api.example.com/mcp",
    onDelete: () => {},
    translations: { delete: "Delete" },
  });

export const WithRepositoryAndWebsite = () =>
  React.createElement(McpServerCardButtons, {
    url: "https://api.example.com/mcp",
    respositoryUrl: "https://github.com/example/example-mcp-server",
    websiteUrl: "https://example.com",
    translations: {
      sourceCode: "Source code",
      website: "Website",
    },
  });

export const Full = () =>
  React.createElement(McpServerCardButtons, {
    url: "https://api.example.com/mcp",
    onDelete: () => {},
    respositoryUrl: "https://github.com/example/example-mcp-server",
    websiteUrl: "https://example.com",
    translations: {
      delete: "Delete",
      sourceCode: "Source code",
      website: "Website",
    },
  });