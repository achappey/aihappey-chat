import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ServerManagement } from "aihappey-components";
import type {
  McpRegistryServerResponse,
  ServerClientConfig,
} from "aihappey-types";

type ServerEntry = {
  config: ServerClientConfig;
  registry?: McpRegistryServerResponse;
};

type ServersMap = Record<string, ServerEntry>;

const initialServers: ServersMap = {
  "example-mcp-server": {
    config: {
      type: "http",
      url: "https://api.example.com/mcp"
    },
    registry: {
      server: {
        name: "example-mcp-server",
        title: "Example MCP Server",
        description:
          "Server with registry metadata (icons, repository, authors).",
        websiteUrl: "https://example.com",
        version: "1.0.0",
        repository: {
          url: "https://github.com/example/example-mcp-server",
        },
        icons: [
          { src: "https://placehold.co/32x32?text=L", theme: "light" },
          { src: "https://placehold.co/32x32/111/fff?text=D", theme: "dark" },
        ],
      },
      _meta: {
        registry: {
          authors: [{ name: "Example Author" }],
        },
      },
    },
  },
  "minimal-server": {
    config: {
      type: "http",
      url: "https://minimal.example.com/mcp"
    },
    registry: {
      server: {
        name: "minimal-server",
        version: "0.1.0",
      },
      _meta: {},
    },
  },
};

const Wrapper = ({
  initialEnabled,
  initialServers,
  removable = true,
}: {
  initialEnabled?: string[];
  initialServers?: ServersMap;
  removable?: boolean;
}) => {
  const [enabled, setEnabled] = useState<Set<string>>(
    new Set(initialEnabled ?? [])
  );
  const [mcpServers, setMcpServers] = useState<ServersMap>(
    initialServers ?? initialServersFallback
  );

  function onToggle(name: string) {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function onRemove(name: string) {
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
  }

  return (
    <ServerManagement
      enabled={enabled}
      mcpServers={mcpServers}
      onToggle={onToggle}
      onRemove={removable ? onRemove : undefined}
    />
  );
};

const initialServersFallback = initialServers;

const meta: Meta<typeof ServerManagement> = {
  title: "Forms/Model Context/ServerManagement",
  component: ServerManagement,
};

export default meta;
type Story = StoryObj<typeof ServerManagement>;

/**
 * INTERACTIVE — toggle + remove servers
 */
export const Interactive: Story = {
  render: () => (
    <Wrapper
      initialEnabled={["example-mcp-server"]}
      initialServers={initialServers}
      removable
    />
  ),
};

/**
 * READ ONLY — toggling only, no remove
 */
export const ReadOnly: Story = {
  render: () => (
    <Wrapper
      initialEnabled={["example-mcp-server"]}
      initialServers={initialServers}
      removable={false}
    />
  ),
};
