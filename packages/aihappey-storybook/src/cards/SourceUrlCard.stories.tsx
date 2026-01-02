import type { Meta, StoryObj } from "@storybook/react";
import type { SourceUrlUIPart } from "aihappey-ai";
import { SourceUrlCard } from "aihappey-components";

const meta = {
  title: "Cards/SourceUrlCard",
  component: SourceUrlCard,
} satisfies Meta<typeof SourceUrlCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultSource: SourceUrlUIPart = {
  type: "source-url",
  url: "https://example.com/path/to/article?ref=aihappey&utm_source=storybook",
  sourceId: "example-article",
  title: "Example source",
};

export const Default: Story = {
  args: {
    source: defaultSource,
  },
};

export const LongTitleAndUrl: Story = {
  args: {
    source: {
      ...defaultSource,
      title:
        "A very long source title that should still render nicely inside the card header without breaking layout",
      url:
        "https://example.com/really/long/path/that/keeps/going/and/going?query=lots%20of%20parameters&another=one-more&evenMore=true#section-123",
    },
  },
};

