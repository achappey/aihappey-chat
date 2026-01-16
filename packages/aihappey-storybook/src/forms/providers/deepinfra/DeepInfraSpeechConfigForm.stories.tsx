import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { DeepInfraSpeechConfig, DeepInfraSpeechConfigForm } from "aihappey-components";

const meta: Meta<typeof DeepInfraSpeechConfigForm> = {
  title: "Forms/Providers/DeepInfra/SpeechConfigForm",
  component: DeepInfraSpeechConfigForm,
};

export default meta;
type Story = StoryObj<typeof DeepInfraSpeechConfigForm>;

const Template: React.FC<{ initial: DeepInfraSpeechConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<DeepInfraSpeechConfig>(initial);

  return <DeepInfraSpeechConfigForm config={config} updateConfig={setConfig} />;
};

export const Default: Story = {
  render: () => <Template initial={{}} />,
};

export const PriorityTier: Story = {
  render: () => <Template initial={{ service_tier: "priority" }} />,
};

export const ResembleAISettings: Story = {
  render: () => (
    <Template
      initial={{
        service_tier: "priority",
        resembleai: {
          response_format: "mp3",
          voice_id: "luna",
          language_id: "en",
          exaggeration: 0.35,
          cfg: 0.6,
          temperature: 1.2,
          seed: 123,
          top_p: 0.9,
          min_p: 0.05,
          repetition_penalty: 1.1,
          top_k: 120,
          webhook: "https://example.com/deepinfra",
        },
      }}
    />
  ),
};
