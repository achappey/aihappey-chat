import type { Meta, StoryObj } from "@storybook/react";
import { AuthorBadge } from "aihappey-components";

const meta: Meta<typeof AuthorBadge> = {
  title: "Badges/AuthorBadge",
  component: AuthorBadge,
};

export default meta;
type Story = StoryObj<typeof AuthorBadge>;

export const Default: Story = {
  args: {
    author: "Example Author",
  },
};

export const ShortName: Story = {
  render: () => <AuthorBadge author="A" />,
};

export const LongName: Story = {
  render: () => (
    <AuthorBadge author="Very Long Author Name That Should Still Fit Nicely" />
  ),
};

export const Empty: Story = {
  render: () => <AuthorBadge author="" />,
};
