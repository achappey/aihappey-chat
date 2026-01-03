import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ChatSettingsForm } from "aihappey-components";

type WrapperProps = {
  formTitle?: string;
  initialValue?: {
    throttle: number;
  };
};

const Wrapper: React.FC<WrapperProps> = ({
  formTitle,
  initialValue,
}) => {
  const [value, setValue] = useState<{ throttle: number }>(
    initialValue ?? { throttle: 100 }
  );

  return (
    <ChatSettingsForm
      value={value}
      onChange={setValue}
      formTitle={formTitle}
    />
  );
};

const meta: Meta<typeof ChatSettingsForm> = {
  title: "Forms/Chat/ChatSettingsForm",
  component: ChatSettingsForm,
};

export default meta;

type Story = StoryObj<typeof ChatSettingsForm>;

export const Default: Story = {
  render: () => <Wrapper />,
};

export const WithTitle: Story = {
  render: () => (
    <Wrapper formTitle="Chat Configuration" />
  ),
};

export const CustomThrottle: Story = {
  render: () => (
    <Wrapper
      initialValue={{ throttle: 250 }}
      formTitle="Advanced Chat Settings"
    />
  ),
};
