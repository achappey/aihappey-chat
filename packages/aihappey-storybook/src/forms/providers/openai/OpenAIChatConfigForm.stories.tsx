// OpenAIChatConfigForm.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { OpenAIChatConfigForm } from "aihappey-components";

type WrapperProps = {
  config?: any;
};

const Wrapper: React.FC<WrapperProps> = ({ config: initialConfig }) => {
  const [config, setConfig] = useState<any>(initialConfig ?? {});
  return (
    <OpenAIChatConfigForm
      config={config}
      openAISkillOptions={[
        { value: "xlsx", label: "Spreadsheets" },
        { value: "pdf", label: "PDF Reader" },
      ]}
      updateConfig={setConfig}
    />
  );
};

const meta: Meta<typeof OpenAIChatConfigForm> = {
  title: "Forms/Providers/OpenAI/OpenAIChatConfigForm",
  component: OpenAIChatConfigForm,
  render: (args) => <Wrapper {...args} />,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Populated: Story = {
  args: {
    config: {
      reasoning: { effort: "medium", summary: "auto" },
      web_search: {
        search_context_size: "medium",
        user_location: {
          country: "NL",
          region: "Noord-Holland",
          city: "Amsterdam",
          timezone: "Europe/Amsterdam",
          type: "approximate",
        },
      },
      include: ["web_search_call.action.sources"],
      image_generation: {
        model: "gpt-image-1",
        size: "1024x1024",
        quality: "medium",
        input_fidelity: "low",
        background: "auto",
        partial_images: 2,
      },
      code_interpreter: { container: { type: "auto" } },
      truncation: "disabled",
      native_mcp: true,
      parallel_tool_calls: true,
      instructions: "Be concise.",
    },
  },
};
