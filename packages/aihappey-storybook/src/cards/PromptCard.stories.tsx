import type { Meta, StoryObj } from "@storybook/react";
import type { PromptCardBasePrompt } from "aihappey-components";
import { PromptCard } from "aihappey-components";

const meta = {
  title: "Cards/PromptCard",
  component: PromptCard,
} satisfies Meta<typeof PromptCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const basePrompt: PromptCardBasePrompt = {
  name: "summarize",
  title: "Summarize",
  description: "Creates a concise summary of the provided content.",
};

export const Minimal: Story = {
  args: {
    prompt: basePrompt,
  },
};

/**
 * SELECT ACTION — shows the (+) action button
 */
export const WithSelectAction: Story = {
  args: {
    prompt: basePrompt,
    onSelect: () => console.log("Select prompt", basePrompt.name),
  },
};

/**
 * LINK ACTIONS — shows open/copy buttons when `getPromptUrl` is provided
 */
export const WithLinkActions: Story = {
  args: {
    prompt: {
      ...basePrompt,
      description: "Has link actions (open in new window / copy link).",
    },
    getPromptUrl: (p) => `https://example.com/prompts/${encodeURIComponent(p.name)}`,
  },
};

/**
 * ICONS — demonstrates light/dark icon selection (based on theme)
 */
export const WithIcons: Story = {
  args: {
    prompt: {
      ...basePrompt,
      icons: [
        { theme: "light", src: "https://placehold.co/32x32/ffffff/111111?text=L" },
        { theme: "dark", src: "https://placehold.co/32x32/111111/ffffff?text=D" },
      ],
      description: "Card with themed icons (L/D).",
    },
    getPromptUrl: (p) => `https://example.com/prompts/${encodeURIComponent(p.name)}`,
  },
};

