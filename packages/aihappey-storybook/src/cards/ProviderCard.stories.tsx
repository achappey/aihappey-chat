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

export const WithViewAction: Story = {
  args: {
    name: "Anthropic",
    url: "https://anthropic.com",
    urls: {
      homepage: "https://anthropic.com",
      docs: "https://docs.anthropic.com",
      termsOfService: "https://www.anthropic.com/legal/consumer-terms",
      privacyPolicy: "https://www.anthropic.com/legal/privacy",
    },
    image: "https://placehold.co/32x32?text=A",
    description: "Provider with View + external link actions",
    category: "model_provider",
    experimental: true,
    modelTypes: ["language", "image"],
    onView: () => {
      // Storybook demo action placeholder
      console.log("ProviderCard view clicked");
    },
  },
};

export const WithCategoryFirstBadge: Story = {
  args: {
    name: "Example Router",
    urls: {
      homepage: "https://example.com",
      docs: "https://example.com/docs",
    },
    image: "https://placehold.co/32x32?text=R",
    description: "Category badge should render before all other provider badges.",
    category: "gateway_router",
    experimental: true,
    modelTypes: ["language", "speech"],
  },
};

