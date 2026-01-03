import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type {
  ReadResourceResult,
  Resource,
} from "@modelcontextprotocol/sdk/types.js";
import { ResourceTags } from "aihappey-components";

type ResourceTuple = [Resource, ReadResourceResult];

const sampleResources: ResourceTuple[] = [
  [
    {
      uri: "mcp://server/resource-1",
      name: "Resource one",
    } as Resource,
    {
      contents: [
        {
          uri: "mcp://server/resource-1",
          mimeType: "text/plain",
          text: "Example content",
        },
      ],
    } as ReadResourceResult,
  ],
  [
    {
      uri: "mcp://server/resource-2",
      name: "Resource two",
    } as Resource,
    {
      contents: [
        {
          uri: "mcp://server/resource-2",
          mimeType: "text/plain",
          text: "Example content",
        },
      ],
    } as ReadResourceResult,
  ],
];

const meta: Meta<typeof ResourceTags> = {
  title: "Forms/Model Context/ResourceTags",
  component: ResourceTags,
};

export default meta;

type Story = StoryObj<typeof ResourceTags>;

export const Default: Story = {
  render: () => {
    const [resources, setResources] =
      useState<ResourceTuple[]>(sampleResources);

    const removeResource = (uri: string) => {
      setResources((prev) => prev.filter(([r]) => r.uri !== uri));
    };

    return (
      <ResourceTags
        resources={resources}
        removeResource={removeResource}
      />
    );
  },
};

export const Static: Story = {
  render: () => (
    <ResourceTags
      resources={sampleResources}
    />
  ),
};

export const ExtraSmall: Story = {
  render: () => (
    <ResourceTags
      size="extra-small"
      resources={[sampleResources[0]]}
    />
  ),
};

export const Small: Story = {
  render: () => (
    <ResourceTags
      size="small"
      resources={[sampleResources[0]]}
    />
  ),
};

export const Medium: Story = {
  render: () => (
    <ResourceTags
      size="medium"
      resources={[sampleResources[0]]}
    />
  ),
};
