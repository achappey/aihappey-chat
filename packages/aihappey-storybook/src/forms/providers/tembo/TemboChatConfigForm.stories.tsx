import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { TemboChatConfigForm, type TemboChatConfig } from "aihappey-components";

const Wrapper = () => {
  const [config, setConfig] = useState<TemboChatConfig>({
    description: "Fix the authentication bug in the login component",
    repositories: ["https://github.com/org/repo"],
    targetBranch: "main",
    branchName: "feature/auth-fix",
    queueRightAway: true,
  });

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <TemboChatConfigForm config={config} updateConfig={setConfig} />
      <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(config, null, 2)}</pre>
    </div>
  );
};

const meta: Meta<typeof TemboChatConfigForm> = {
  title: "Forms/Providers/Tembo/TemboChatConfigForm",
  component: TemboChatConfigForm,
  render: () => <Wrapper />,
};

export default meta;
type Story = StoryObj<typeof TemboChatConfigForm>;

export const Default: Story = {};

