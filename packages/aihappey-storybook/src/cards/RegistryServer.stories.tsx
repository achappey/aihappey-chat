import type { Meta, StoryObj } from "@storybook/react";
import type { McpRegistryServerResponse } from "aihappey-types";
import { RegistryServerCard } from "aihappey-components";

const meta = {
  title: "Cards/RegistryServerCard",
  component: RegistryServerCard,
} satisfies Meta<typeof RegistryServerCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const staticItem: McpRegistryServerResponse = {
  server: {
    name: "example-mcp-server",
    title: "Example MCP Server",
    description:
      "This is an example MCP registry server used to demonstrate the RegistryServerCard component.",
    websiteUrl: "https://example.com",
    version: "1.0.0",
    repository: {
      url: "https://github.com/example/example-mcp-server",
    },
    icons: [
      {
        src: "https://dummyimage.com/32x32/ccc/000",
        theme: "light",
      },
      {
        src: "https://dummyimage.com/32x32/ccc/000",
        theme: "dark",
      },
    ],
    remotes: [
      {
        type: "streamable-http",
        url: "https://api.example.com/mcp",
      },
    ],
  },
  _meta: {
    registry: {
      authors: [{ name: "Example Author" }],
    },
  },
};

export const Static: Story = {
  args: {
    serverItem: staticItem,
  },
};

export const Minimal: Story = {
  args: {
    serverItem: {
      server: {
        name: "minimal-server",
        version: "0.1.0",
        remotes: [{ type: "streamable-http", url: "https://api.example.com/mcp" }],
      },
      _meta: {},
    },
  },
};

export const NoIcons: Story = {
  args: {
    serverItem: {
      server: {
        name: "no-icons-server",
        title: "No Icons Server",
        description: "Server without icons configured.",
        version: "1.0.0",
        remotes: [{ type: "streamable-http", url: "https://api.example.com/mcp" }],
      },
      _meta: {},
    },
  },
};

export const NoLinks: Story = {
  args: {
    serverItem: {
      server: {
        name: "no-links-server",
        title: "No Links Server",
        description: "Repository and website are missing.",
        version: "1.0.0",
        remotes: [{ type: "streamable-http", url: "https://api.example.com/mcp" }],
        icons: [{ src: "https://placehold.co/32x32" }],
      },
      _meta: {},
    },
  },
};

export const LongDescription: Story = {
  args: {
    serverItem: {
      server: {
        name: "long-description-server",
        title: "Long Description Server",
        description:
          "This server has a very long description intended to overflow the card layout and demonstrate line clamping and ellipsis behavior inside the RegistryServerCard component.",
        version: "1.0.0",
        icons: [{ src: "https://placehold.co/32x32" }],
        remotes: [{ type: "streamable-http", url: "https://api.example.com/mcp" }],
      },
      _meta: {},
    },
  },
};

export const CustomDescription: Story = {
  args: {
    renderDescription: () => <strong>Rendered via renderDescription prop.</strong>,
    serverItem: {
      server: {
        name: "custom-description-server",
        title: "Custom Description",
        description: "Rendered via renderDescription prop.",
        version: "1.0.0",
        icons: [{ src: "https://placehold.co/32x32" }],
        remotes: [{ type: "streamable-http", url: "https://api.example.com/mcp" }],
      },
      _meta: {},
    },
  },
};

