import type { Meta, StoryObj } from "@storybook/react";
import type { DataUIPart } from "aihappey-ai";
import { DataCard } from "aihappey-components";

const meta = {
  title: "Cards/DataCard",
  component: DataCard,
} satisfies Meta<typeof DataCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const exampleBlock: DataUIPart<any> = {
  type: "data-hello",
  data: { hello: "world" },
};

export const Default: Story = {
  args: {
    block: exampleBlock,
  },
};

