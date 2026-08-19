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
    urls: { homepage: "https://openai.com" },
    image: "https://placehold.co/256x256/111827/ffffff/png?text=AI",
    description: "A model provider with a square logo.",
    providerCountry: "US",
  },
};

export const MissingLogo: Story = {
  args: {
    name: "Provider without logo",
    urls: { homepage: "https://example.com" },
  },
};

export const LongName: Story = {
  args: {
    name: "A very long provider name that should still render nicely in the card header",
    urls: { homepage: "https://example.com" },
    image: "https://placehold.co/640x160/2563eb/ffffff/png?text=VERY+WIDE+PROVIDER+LOGO",
    providerCountry: "NL",
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
    image: "https://placehold.co/640x160/111827/ffffff/png?text=ANTHROPIC",
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
    image: "https://placehold.co/640x160/0f766e/ffffff/png?text=ROUTER",
    description: "Category badge should render before all other provider badges.",
    category: "gateway_router",
    experimental: true,
    modelTypes: ["language", "speech"],
  },
};

export const DenseProvider: Story = {
  args: {
    name: "Global multimodal AI platform",
    urls: {
      homepage: "https://example.com",
      pricing: "https://example.com/pricing",
      console: "https://example.com/console",
      docs: "https://example.com/docs",
      termsOfService: "https://example.com/terms",
      privacyPolicy: "https://example.com/privacy",
    },
    image: "https://placehold.co/120x360/9333ea/ffffff/png?text=AI",
    description: "A dense provider card with a tall logo, country, badges, description, and the complete action row.",
    category: "model_provider",
    experimental: true,
    modelTypes: ["language", "image", "speech", "transcription"],
    providerCountry: "SG",
    isFavorite: true,
    onView: () => console.log("Dense provider view clicked"),
    onToggleFavorite: () => console.log("Dense provider favorite toggled"),
  },
};

