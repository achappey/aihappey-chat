import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  ResembleAISpeechConfig,
  ResembleAISpeechConfigForm,
} from "aihappey-components";

const meta: Meta<typeof ResembleAISpeechConfigForm> = {
  title: "Forms/Providers/ResembleAI/SpeechConfigForm",
  component: ResembleAISpeechConfigForm,
};

export default meta;
type Story = StoryObj<typeof ResembleAISpeechConfigForm>;

const Template: React.FC<{ initial: ResembleAISpeechConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<ResembleAISpeechConfig>(initial);

  return (
    <ResembleAISpeechConfigForm
      config={config}
      updateConfig={setConfig}
    />
  );
};

export const Default: Story = {
  render: () => <Template initial={{}} />,
};

export const Populated: Story = {
  render: () => (
    <Template
      initial={{
        voice_uuid: "voice_uuid_123",
        project_uuid: "project_uuid_456",
        title: "Demo clip title",
        output_format: "mp3",
        precision: "PCM_16",
        sample_rate: 44100,
        use_hd: true,
      }}
    />
  ),
};

