import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { AudixaSpeechConfigForm, type AudixaSpeechConfig } from "aihappey-components";

const meta: Meta<typeof AudixaSpeechConfigForm> = {
  title: "Forms/Providers/Audixa/SpeechConfigForm",
  component: AudixaSpeechConfigForm,
};

export default meta;
type Story = StoryObj<typeof AudixaSpeechConfigForm>;

const Template = ({ initial }: { initial: AudixaSpeechConfig }) => {
  const [config, setConfig] = useState<AudixaSpeechConfig>(initial ?? {});
  return <AudixaSpeechConfigForm config={config} updateConfig={setConfig} />;
};

export const Default: Story = {
  render: () => (
    <Template
      initial={{
        voice: "af_bella",
        speed: 1,
        emotion: "neutral",
        temperature: 0.9,
        top_p: 0.9,
      }}
    />
  ),
};
