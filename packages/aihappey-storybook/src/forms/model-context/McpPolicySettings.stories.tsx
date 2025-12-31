// McpPolicySettings.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { McpPolicySettings } from "aihappey-components";

const meta: Meta<typeof McpPolicySettings> = {
  title: "Forms/Model Context/McpPolicySettings",
  component: McpPolicySettings,
};
export default meta;

type Story = StoryObj<typeof McpPolicySettings>;

type PolicySettings = Record<string, boolean>;

const Wrapper = ({ initial }: { initial?: PolicySettings }) => {
  const [policy, setPolicy] = useState<PolicySettings>(initial ?? {});

  const toggle = (key: any) => {
    setPolicy((p) => ({
      ...p,
      [key]: !p?.[key],
    }));
  };

  return (
    <McpPolicySettings
      policySettings={policy}
      toggle={toggle}
    />
  );
};

/**
 * EMPTY — nothing enabled
 */
export const Empty: Story = {
  render: () => <Wrapper initial={{}} />,
};

/**
 * PARTIAL — some hints enabled
 */
export const Partial: Story = {
  render: () => (
    <Wrapper
      initial={{
        openWorldHint: true,
        readOnlyHint: true,
      }}
    />
  ),
};

/**
 * ALL ENABLED — full policy surface
 */
export const AllEnabled: Story = {
  render: () => (
    <Wrapper
      initial={{
        openWorldHint: true,
        destructiveHint: true,
        readOnlyHint: true,
        idempotentHint: true,
      }}
    />
  ),
};