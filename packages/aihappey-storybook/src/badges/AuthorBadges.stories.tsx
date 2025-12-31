import type { Meta, StoryObj } from "@storybook/react";
import { AuthorBadges } from "aihappey-components";

const meta: Meta<typeof AuthorBadges> = {
  title: "Badges/AuthorBadges",
  component: AuthorBadges,
};

export default meta;
type Story = StoryObj<typeof AuthorBadges>;

export const None: Story = {
  render: () => <AuthorBadges authors={[]} />,
};

export const One: Story = {
  render: () => <AuthorBadges authors={["Example Author"]} />,
};

export const Many: Story = {
  render: () => (
    <AuthorBadges authors={["Alice", "Bob", "Charlie", "Dana"]} />
  ),
};

export const WithEmptyValues: Story = {
  render: () => (
    <AuthorBadges authors={["Alice", "", "Bob"]} />
  ),
};
