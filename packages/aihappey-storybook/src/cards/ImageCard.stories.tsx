import type { Meta, StoryObj } from "@storybook/react";
import type { ImageContent } from "@modelcontextprotocol/sdk/types.js";
import { ImageCard } from "aihappey-components";

const meta = {
    title: "Cards/ImageCard",
    component: ImageCard,
} satisfies Meta<typeof ImageCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// 1x1 transparent PNG
const image: ImageContent = {
    mimeType: "image/png",
    type: "image",
    data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X2b0AAAAASUVORK5CYII=",
};

export const Default: Story = {
    args: {
        image,
    },
};

export const FitContain: Story = {
    args: {
        image,
        fit: "contain",
    },
};

export const FitCover: Story = {
    args: {
        image,
        fit: "cover",
    },
};

export const FitNone: Story = {
    args: {
        image,
        fit: "none",
    },
};

