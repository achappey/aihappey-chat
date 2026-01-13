import React, { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { AiChatToolsSettingsForm } from "aihappey-components";

const meta = {
  title: "Forms/Chat/AiChatToolsSettingsForm",
  component: AiChatToolsSettingsForm,
  args: {
    formTitle: "Tools",
    availableTools: [
      "local_tools_list",
      "local_tools_create",
      "local_tools_delete",
      "local_agents_list",
    ],
    value: {
      toolChoice: undefined,
      maxToolCalls: undefined,
      stopTools: [],
    },
    // keep required prop satisfied; Controlled will also call it (actions panel)
    onChange: (() => {}) as any,
  },
  argTypes: {
    formTitle: { control: "text" },
    availableTools: { control: "object" },
    value: { control: "object" },
    onChange: { action: "change", control: false },
  },
} satisfies Meta<typeof AiChatToolsSettingsForm>;

export default meta;
type Story = StoryObj<typeof meta>;

const Controlled: React.FC<React.ComponentProps<typeof AiChatToolsSettingsForm>> = (
  args
) => {
  const [value, setValue] = useState(args.value);

  // reset when switching stories / controls
  useEffect(() => {
    setValue(args.value);
  }, [args.value]);

  return (
    <AiChatToolsSettingsForm
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

export const ToolChoiceNone: Story = {
  args: {
    value: {
      toolChoice: "none",
      maxToolCalls: undefined,
      stopTools: [],
    },
  },
  render: (args) => <Controlled {...args} />,
};

export const ToolChoiceRequired: Story = {
  args: {
    value: {
      toolChoice: "required",
      maxToolCalls: 3,
      stopTools: ["local_tools_delete"],
    },
  },
  render: (args) => <Controlled {...args} />,
};

export const WithStopToolsOnly: Story = {
  args: {
    value: {
      toolChoice: undefined,
      maxToolCalls: undefined,
      stopTools: ["local_agents_list", "local_tools_list"],
    },
  },
  render: (args) => <Controlled {...args} />,
};
