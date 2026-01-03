import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { AiChatSettingsForm } from "aihappey-components";

type WrapperProps = {
  formTitle?: string;
  initialValue?: {
    temperature: number;
  };
};

const Wrapper: React.FC<WrapperProps> = ({
  formTitle,
  initialValue,
}) => {
  const [value, setValue] = useState<{ temperature: number }>(
    initialValue ?? { temperature: 0.7 }
  );

  return (
    <AiChatSettingsForm
      value={value}
      onChange={setValue}
      formTitle={formTitle}
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
