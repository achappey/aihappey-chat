import { Resource } from "@modelcontextprotocol/sdk/types.js";
import type { Meta, StoryObj } from "@storybook/react";
import { ResourceCard } from "aihappey-components";

const exampleResource: Resource = {
  uri: "https://www.nu.nl",
  name: "nu.nl",
  title: "nu.nl",
  description: "Dutch news site (example resource for the ResourceCard story).",
  mimeType: "text/html",
  annotations: {
    // MCP spec uses `priority` to help rank resources.
    priority: 0.8,
  },
};

const meta = {
  title: "Cards/ResourceCard",
  component: ResourceCard,
  argTypes: {
    resource: {
      control: "object",
    },
  },
} satisfies Meta<typeof ResourceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    resource: exampleResource,
  },
};

export const WithOnSelect: Story = {
  args: {
    resource: exampleResource,
    onSelect: () => {
      // Storybook action could be wired up, but we keep it dependency-free.
      // eslint-disable-next-line no-console
      console.log("Resource selected", exampleResource.uri);
    },
  },
};

export const Minimal: Story = {
  args: {
    resource: {
      uri: "https://example.com/resource",
      name: "example resource",
    },
  },
};

