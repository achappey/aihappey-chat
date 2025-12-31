import type { Meta, StoryObj } from "@storybook/react";
import { ToolApprovalBadge } from "aihappey-components";

const meta: Meta<typeof ToolApprovalBadge> = {
  title: "Badges/ToolApprovalBadge",
  component: ToolApprovalBadge,
};

export default meta;
type Story = StoryObj<typeof ToolApprovalBadge>;

/**
 * YOLO — approved with YOLO reason
 */
export const YoloApproved: Story = {
  render: () => (
    <ToolApprovalBadge
      state="approval-responded"
      toolName="example-tool"
      approval={{
        approved: true,
        reason: "YOLO",
      }}
    />
  ),
};

/**
 * TOOL — approved because tool name matched
 */
export const ToolApproved: Story = {
  render: () => (
    <ToolApprovalBadge
      state="approval-responded"
      toolName="example-tool"
      approval={{
        approved: true,
        reason: "example-tool",
      }}
    />
  ),
};

/**
 * APPROVED — but reason does not match (renders nothing)
 */
export const ApprovedOtherReason: Story = {
  render: () => (
    <ToolApprovalBadge
      state="approval-responded"
      toolName="example-tool"
      approval={{
        approved: true,
        reason: "something-else",
      }}
    />
  ),
};

/**
 * NOT APPROVED — renders nothing
 */
export const NotApproved: Story = {
  render: () => (
    <ToolApprovalBadge
      state="approval-responded"
      toolName="example-tool"
      approval={{
        approved: false,
        reason: "YOLO",
      }}
    />
  ),
};

/**
 * WRONG STATE — renders nothing
 */
export const WrongState: Story = {
  render: () => (
    <ToolApprovalBadge
      state="input-available"
      toolName="example-tool"
      approval={{
        approved: true,
        reason: "YOLO",
      }}
    />
  ),
};
