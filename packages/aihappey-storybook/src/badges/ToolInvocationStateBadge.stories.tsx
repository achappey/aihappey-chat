import type { Meta, StoryObj } from "@storybook/react";
import { ToolInvocationStateBadge } from "aihappey-components";

const meta: Meta<typeof ToolInvocationStateBadge> = {
  title: "Badges/ToolInvocationStateBadge",
  component: ToolInvocationStateBadge,
};

export default meta;
type Story = StoryObj<typeof ToolInvocationStateBadge>;

export const InputAvailable: Story = {
  render: () => (
    <ToolInvocationStateBadge state="input-available" />
  ),
};

export const InputStreaming: Story = {
  render: () => (
    <ToolInvocationStateBadge state="input-streaming" />
  ),
};

export const OutputSuccess: Story = {
  render: () => (
    <ToolInvocationStateBadge
      state="output-available"
      isError={false}
    />
  ),
};

export const OutputError: Story = {
  render: () => (
    <ToolInvocationStateBadge
      state="output-available"
      isError
    />
  ),
};

export const OutputStateError: Story = {
  render: () => (
    <ToolInvocationStateBadge state="output-error" />
  ),
};

/**
 * APPROVAL — approved
 */
export const ApprovalApproved: Story = {
  render: () => (
    <ToolInvocationStateBadge
      state="approval-responded"
      approved
    />
  ),
};

/**
 * APPROVAL — denied
 */
export const ApprovalDenied: Story = {
  render: () => (
    <ToolInvocationStateBadge
      state="approval-responded"
      approved={false}
    />
  ),
};

/**
 * APPROVAL — error
 */
export const ApprovalError: Story = {
  render: () => (
    <ToolInvocationStateBadge
      state="approval-responded"
      isError
    />
  ),
};
