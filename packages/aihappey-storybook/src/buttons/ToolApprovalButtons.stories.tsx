import type { Meta, StoryObj } from "@storybook/react";
import { ToolApprovalButtons } from "aihappey-components";

const meta = {
  title: "Buttons/ToolApprovalButtons",
  component: ToolApprovalButtons,
} satisfies Meta<typeof ToolApprovalButtons>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    toolName: "web_search",
    toolTitle: "Web Search",
    canViewOutput: true,
    translations: {
      automatic: "Automatic",
      allow: "Allow",
      deny: "Deny",
      thisTool: ({ toolName }) => `Allow ${toolName ?? "this tool"}`,
      allTools: "Allow all tools",
    },
    onViewOutput: () => console.log("View output"),
    onAllow: () => console.log("Allow"),
    onDeny: () => console.log("Deny"),
    onAllowThisTool: () => console.log("Allow this tool"),
    onAllowAllTools: () => console.log("Allow all tools"),
  },
};


export const MediumNoOutput: Story = {
  args: {
    size: "medium",
    toolName: "web_search",
    toolTitle: "Web Search",
    canViewOutput: false,
    translations: {
      automatic: "Automatic",
      allow: "Allow",
      deny: "Deny",
      thisTool: ({ toolName }) => `Allow ${toolName ?? "this tool"}`,
      allTools: "Allow all tools",
    },
    onViewOutput: () => console.log("View output"),
    onAllow: () => console.log("Allow"),
    onDeny: () => console.log("Deny"),
    onAllowThisTool: () => console.log("Allow this tool"),
    onAllowAllTools: () => console.log("Allow all tools"),
  },
};

