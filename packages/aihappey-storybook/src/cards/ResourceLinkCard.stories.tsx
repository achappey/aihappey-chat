import type { Meta, StoryObj } from "@storybook/react";
import type { ResourceLink } from "@modelcontextprotocol/sdk/types.js";
import { ResourceLinkCard } from "aihappey-components";

const imageLink: ResourceLink = {
  uri: "https://via.placeholder.com/640x360",
  type: "resource_link",
  name: "Example image",
  mimeType: "image/png",
};

const audioLink: ResourceLink = {
  uri: "https://www.w3schools.com/html/horse.ogg",
  type: "resource_link",
  name: "Example audio",
  mimeType: "audio/ogg",
};

const videoLink: ResourceLink = {
  uri: "https://www.w3schools.com/html/mov_bbb.mp4",
  type: "resource_link",
  name: "Example video",
  mimeType: "video/mp4",
};

const unknownLink: ResourceLink = {
  uri: "https://example.com/resource.bin",
  type: "resource_link",
  name: "Unknown content",
  mimeType: "application/octet-stream",
};

const meta = {
  title: "Cards/ResourceLinkCard",
  component: ResourceLinkCard,
} satisfies Meta<typeof ResourceLinkCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Image: Story = {
  args: {
    block: imageLink,
  },
};

export const Audio: Story = {
  args: {
    block: audioLink,   
  },
};

export const Video: Story = {
  args: {
    block: videoLink, 
  },
};

export const UnknownMime: Story = {
  args: {
    block: unknownLink,
  },
};

