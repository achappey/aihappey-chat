import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme } from "aihappey-types";

type TabsStoryArgs = {
  vertical?: boolean;
  size?: "small" | "medium" | "large";
  className?: string;
  style?: React.CSSProperties;
  tabCount?: number;
};

const TabsStory = ({ tabCount = 2, ...args }: TabsStoryArgs) => {
  const { Tabs, Tab } = useTheme() as unknown as Pick<AihUiTheme, "Tabs" | "Tab">;
  const [activeKey, setActiveKey] = useState<string>("tab1");
  const tabs = Array.from({ length: tabCount }, (_, index) => index + 1);

  return (
    <Tabs {...args} activeKey={activeKey} onSelect={setActiveKey}>
      {tabs.map((tabNumber) => (
        <Tab key={tabNumber} eventKey={`tab${tabNumber}`} title={`Tab ${tabNumber}`}>
          Content for Tab {tabNumber}
        </Tab>
      ))}
    </Tabs>
  );
};

const meta = {
  title: "Tabs",
  component: TabsStory,
  argTypes: {
    vertical: { control: { type: "boolean" } },
    size: { control: { type: "select" }, options: ["small", "medium", "large"] },
    tabCount: { control: { type: "number", min: 2, max: 16 } },
  },
  args: {
    vertical: false,
    size: "medium",
    tabCount: 2,
  },
} satisfies Meta<typeof TabsStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Vertical: Story = {
  args: {
    vertical: true,
  },
};

export const Large: Story = {
  args: {
    size: "large",
  },
};

export const Overflow: Story = {
  args: {
    tabCount: 12,
    style: { maxWidth: 420 },
  },
};
