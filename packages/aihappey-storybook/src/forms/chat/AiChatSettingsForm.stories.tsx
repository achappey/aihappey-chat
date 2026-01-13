import React, { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { AiChatSettingsForm } from "aihappey-components";

const meta = {
  title: "Forms/Chat/AiChatSettingsForm",
  component: AiChatSettingsForm,
  args: {
    formTitle: "AI Configuration",
    value: {
      temperature: 0.7,
      maxOutputTokens: undefined,
    },
    // keep required prop satisfied; Controlled will also call it (actions panel)
    onChange: (() => {}) as any,
  },
  argTypes: {
    formTitle: { control: "text" },
    value: { control: "object" },
    onChange: { action: "change", control: false },
  },
} satisfies Meta<typeof AiChatSettingsForm>;

export default meta;
type Story = StoryObj<typeof meta>;

const Controlled: React.FC<React.ComponentProps<typeof AiChatSettingsForm>> = (
  args
) => {
  const [value, setValue] = useState(args.value);

  // reset when switching stories / controls
  useEffect(() => {
    setValue(args.value);
  }, [args.value]);

  return (
    <AiChatSettingsForm
      {...args}
      value={value}
      onChange={(next) => {
        setValue(next);
        args.onChange?.(next);
      }}
    />
  );
};

export const Playground: Story = {
  render: (args) => <Controlled {...args} />,
};

export const Minimal: Story = {
  args: {
    formTitle: undefined,
    value: { temperature: 0.7, maxOutputTokens: undefined },
  },
  render: (args) => <Controlled {...args} />,
};

export const WithMaxOutputTokens: Story = {
  args: {
    value: { temperature: 0.5, maxOutputTokens: 512 },
  },
  render: (args) => <Controlled {...args} />,
};
