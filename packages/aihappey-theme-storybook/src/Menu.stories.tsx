import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme } from "aihappey-types";

type MenuStoryArgs = {
  align?: "left" | "right";
  size?: "small" | "medium";
  useCustomTrigger?: boolean;
};

const MenuStory = ({ useCustomTrigger, ...args }: MenuStoryArgs) => {
  const { Menu, Button } = useTheme() as unknown as Pick<AihUiTheme, "Menu" | "Button">;
  return (
    <Menu
      {...args}
      trigger={useCustomTrigger ? <Button>Menu Trigger</Button> : undefined}
      items={[
        { key: "1", label: "Item 1", icon: "add", onClick: () => console.log("Menu: item 1") },
        { key: "2", label: "Item 2", icon: "copy", onClick: () => console.log("Menu: item 2") },
        {
          key: "more",
          label: "More actions",
          children: [{ key: "nested", label: "Nested action", onClick: () => console.log("Menu: nested") }],
        },
        { key: "3", label: "Delete", danger: true, onClick: () => console.log("Menu: delete") },
      ]}
    />
  );
};

const meta = {
  title: "Menu",
  component: MenuStory,
  argTypes: {
    align: { control: { type: "select" }, options: ["left", "right"] },
    size: { control: { type: "select" }, options: ["small", "medium"] },
    useCustomTrigger: { control: { type: "boolean" } },
  },
  args: {
    align: "left",
    size: "medium",
    useCustomTrigger: true,
  },
} satisfies Meta<typeof MenuStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const RightAligned: Story = {
  args: {
    align: "right",
  },
};

