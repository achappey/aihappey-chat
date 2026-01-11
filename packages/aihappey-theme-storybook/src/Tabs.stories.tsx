import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme } from "aihappey-types";

type TabsStoryArgs = {
  vertical?: boolean;
  size?: "small" | "medium" | "large";
  className?: string;
  style?: React.CSSProperties;
};

const TabsStory = (args: TabsStoryArgs) => {
  const { Tabs, Tab } = useTheme() as unknown as Pick<AihUiTheme, "Tabs" | "Tab">;
  const [activeKey, setActiveKey] = useState<string>("tab1");

  return (
    <Tabs {...args} activeKey={activeKey} onSelect={setActiveKey}>
      <Tab eventKey="tab1" title="Tab 1">
        Content for Tab 1
      </Tab>
      <Tab eventKey="tab2" title="Tab 2">
        Content for Tab 2
      </Tab>
    </Tabs>
  );
};

const meta = {
  title: "Tabs",
  component: TabsStory,
} satisfies Meta<typeof TabsStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

