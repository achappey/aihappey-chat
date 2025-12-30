import type { Meta, StoryObj } from "@storybook/react";
import { TextCard } from "aihappey-components";

const meta = {
  title: "Cards/TextCard",
  component: TextCard,
} satisfies Meta<typeof TextCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    block: {
      type: "text",
      text: "This is a simple text card.",
    },
  },
};

export const WithMarkdown: Story = {
  args: {
    block: {
      type: "text",
      text: "# Heading\n\n- List item 1\n- List item 2",
    },
  },
};

export const RenderAsPre: Story = {
  args: {
    block: {
      type: "text",
      text: "Line 1\nLine 2\nLine 3",
    },
    renderText: (text) => <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{text}</pre>,
  },
};

