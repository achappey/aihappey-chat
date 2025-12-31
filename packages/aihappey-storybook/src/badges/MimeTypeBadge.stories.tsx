import type { Meta, StoryObj } from "@storybook/react";
import { MimeTypeBadge } from "aihappey-components";

const meta: Meta<typeof MimeTypeBadge> = {
  title: "Badges/MimeTypeBadge",
  component: MimeTypeBadge,
};

export default meta;
type Story = StoryObj<typeof MimeTypeBadge>;

export const Pdf: Story = {
  render: () => <MimeTypeBadge mimeType="application/pdf" />,
};

export const Json: Story = {
  render: () => <MimeTypeBadge mimeType="application/json" />,
};

export const Image: Story = {
  render: () => <MimeTypeBadge mimeType="image/png" />,
};
