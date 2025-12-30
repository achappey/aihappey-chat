import type { Meta, StoryObj } from "@storybook/react";
import { LimitedTextField } from "aihappey-components";

const meta = {
  title: "Fields/LimitedTextField",
  component: LimitedTextField,
} satisfies Meta<typeof LimitedTextField>;

export default meta;
type Story = StoryObj<typeof meta>;

const shortText = "This is a short text.";
const longText =
  "This is a very long text that should be truncated because it exceeds the number of lines specified in the component. We are testing if the ellipsis appears correctly and if the text is hidden as expected.";

export const Short: Story = {
  args: {
    text: shortText,
  },
};

export const Long: Story = {
  args: {
    text: longText,
  },
};

export const CustomRows: Story = {
  args: {
    text: longText,
    rows: 2,
  },
};

