import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme } from "aihappey-types";

type HeaderStoryArgs = {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children: string;
};

const HeaderStory = (args: HeaderStoryArgs) => {
  const { Header } = useTheme() as unknown as Pick<AihUiTheme, "Header">;
  return <Header {...args} />;
};

const meta = {
  title: "Header",
  component: HeaderStory,
  argTypes: {
    level: { control: { type: "select" }, options: [1, 2, 3, 4, 5, 6] },
    children: { control: { type: "text" } },
  },
  args: {
    level: 1,
    children: "Heading Level 1",
  },
} satisfies Meta<typeof HeaderStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const HeadingScale: Story = {
  render: () => {
    const { Header } = useTheme() as unknown as Pick<AihUiTheme, "Header">;
    return (
      <div style={{ display: "grid", gap: 8 }}>
        {[1, 2, 3, 4, 5, 6].map((level) => (
          <Header key={level} level={level as HeaderStoryArgs["level"]}>
            Heading Level {level}
          </Header>
        ))}
      </div>
    );
  },
};

