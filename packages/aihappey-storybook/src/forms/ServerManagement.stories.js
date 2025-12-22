import React, { useState } from "react";
import { ServerManagement } from "aihappey-components";

export default {
  title: "Forms/ServerManagement",
  component: ServerManagement,
};

const initialServers = {
  "example-mcp-server": {
    config: { url: "https://api.example.com/mcp" },
    registry: {
      server: {
        name: "example-mcp-server",
        title: "Example MCP Server",
        description: "Server with registry metadata (icons, repository, authors).",
        websiteUrl: "https://example.com",
        version: "1.0.0",
        repository: { url: "https://github.com/example/example-mcp-server" },
        icons: [
          { src: "https://placehold.co/32x32?text=L", theme: "light" },
          { src: "https://placehold.co/32x32/111/fff?text=D", theme: "dark" },
        ],
      },
      _meta: { registry: { authors: [{ name: "Example Author" }] } },
    },
  },
  "minimal-server": {
    config: { url: "https://minimal.example.com/mcp" },
    registry: {
      server: { name: "minimal-server", version: "0.1.0" },
      _meta: {},
    },
  },
};

export const Interactive = () => {
  const [enabled, setEnabled] = useState(new Set(["example-mcp-server"]));
  const [mcpServers, setMcpServers] = useState(initialServers);

  const onToggle = (name) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const onRemove = (name) => {
    setMcpServers((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setEnabled((prev) => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
  };

  return React.createElement(ServerManagement, {
    enabled,
    mcpServers,
    onToggle,
    onRemove,
  });
};

export const ReadOnly = () =>
  React.createElement(ServerManagement, {
    enabled: new Set(["example-mcp-server"]),
    mcpServers: initialServers,
    onToggle: () => {},
  });