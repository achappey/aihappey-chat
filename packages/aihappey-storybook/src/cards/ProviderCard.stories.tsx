import type { Meta, StoryObj } from "@storybook/react";
import { ProviderCard } from "aihappey-components";

const meta = {
  title: "Cards/ProviderCard",
  component: ProviderCard,
} satisfies Meta<typeof ProviderCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: "OpenAI",
    url: "https://openai.com",
    image: "https://placehold.co/32x32?text=AI",
  },
};

export const MissingLogo: Story = {
  args: {
    name: "Provider without logo",
    url: "https://example.com",
  },
};

export const LongName: Story = {
  args: {
    name: "A very long provider name that should still render nicely in the card header",
    url: "https://example.com",
    image: "https://placehold.co/32x32?text=P",
  },
};

