import type { Meta, StoryObj } from "@storybook/react";
import type { SourceUrlUIPart } from "aihappey-ai";
import { MessageSourcesDrawer } from "aihappey-components";

const meta = {
  title: "Drawers/MessageSourcesDrawer",
  component: MessageSourcesDrawer,
} satisfies Meta<typeof MessageSourcesDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

const sources: SourceUrlUIPart[] = [
  {
    type: "source-url",
    url: "https://example.com/docs/getting-started",
    sourceId: "example-docs",
    title: "Example docs — Getting started",
  },
  {
    type: "source-url",
    url: "https://example.com/blog/why-storybook",
    sourceId: "example-blog",
    title: "Why Storybook helps component development",
  },
  {
    type: "source-url",
    url: "https://developer.mozilla.org/en-US/docs/Web/API/URL",
    sourceId: "mdn-url",
    title: "MDN: URL",
  },
];

export const Empty: Story = {
  args: {
    open: true,
    sources: [],
    size: "small",
    onClose: () => console.log("Close"),
  },
};

export const MultipleHosts: Story = {
  args: {
    open: true,
    sources,
    size: "medium",
    onClose: () => console.log("Close"),
  },
};

