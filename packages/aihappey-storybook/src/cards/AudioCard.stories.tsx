import type { Meta, StoryObj } from "@storybook/react";
import { AudioCard } from "aihappey-components";

const meta = {
  title: "Cards/AudioCard",
  component: AudioCard,
} satisfies Meta<typeof AudioCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    block: {
      type: "audio",
      mimeType: "audio/wav",
      // Minimal 1 second silent wav base64
      data: "UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=",
    },
  },
};

