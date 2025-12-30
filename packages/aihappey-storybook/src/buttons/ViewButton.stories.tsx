import type { Meta, StoryObj } from "@storybook/react";
import { ViewButton } from "aihappey-components";

const meta = {
    title: "Buttons/ViewButton",
    component: ViewButton,
} satisfies Meta<typeof ViewButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        onClick: () => console.log("View clicked"),
    },
};

export const Disabled: Story = {
    args: {
        disabled: true,
        onClick: () => console.log("Should not fire when disabled"),
    },
};

export const SubtleSmallWithTitle: Story = {
    args: {
        size: "small",
        variant: "subtle",
        title: "View output",
        onClick: () => console.log("View clicked"),
    },
};

