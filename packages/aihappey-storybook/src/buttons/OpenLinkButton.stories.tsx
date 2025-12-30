// src/OpenLinkButton.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { OpenLinkButton } from "aihappey-components";

const meta = {
  title: "Buttons/OpenLinkButton",
  component: OpenLinkButton,
} satisfies Meta<typeof OpenLinkButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    url: "https://example.com",
    text: "Open Example",
  },
};

export const IconOnly: Story = {
  args: {
    url: "https://example.com",
    title: "Go to Example",
  },
};

export const Disabled: Story = {
  args: {
    url: "https://example.com",
    text: "Cannot Open",
    disabled: true,
  },
};

export const SmallSubtle: Story = {
  args: {
    url: "https://example.com",
    size: "small",
    variant: "subtle",
  },
};
