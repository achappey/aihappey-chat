import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { AiChatSettingsForm } from "aihappey-components";

type WrapperProps = {
  formTitle?: string;
  initialValue?: {
    temperature: number;
    maxOutputTokens?: number;
    stopTools?: string[];
    maxToolCalls?: number;
    toolChoice?: string;
  };
};

const Wrapper: React.FC<WrapperProps> = ({
  formTitle,
  initialValue,
}) => {
  const [value, setValue] = useState<{
    temperature: number;
    maxOutputTokens?: number;
    stopTools?: string[];
    maxToolCalls?: number;
    toolChoice?: string;
  }>(
    initialValue ?? { temperature: 0.7, toolChoice: undefined, stopTools: [] }
  );

  const availableTools = [
    "local_tools_list",
    "local_tools_create",
    "local_tools_delete",
    "local_agents_list",
  ];

  return (
    <AiChatSettingsForm
      value={value}
      onChange={setValue}
      formTitle={formTitle}
      availableTools={availableTools}
    />
  );
};

const meta: Meta<typeof AiChatSettingsForm> = {
  title: "Forms/Chat/AiChatSettingsForm",
  component: AiChatSettingsForm,
};

export default meta;

type Story = StoryObj<typeof AiChatSettingsForm>;

export const Default: Story = {
  render: () => <Wrapper />,
};

export const WithTitle: Story = {
  render: () => (
    <Wrapper formTitle="AI Configuration" />
  ),
};

export const CustomTemperature: Story = {
  render: () => (
    <Wrapper
      initialValue={{ temperature: 0.2 }}
      formTitle="Low Creativity Mode"
    />
  ),
};
