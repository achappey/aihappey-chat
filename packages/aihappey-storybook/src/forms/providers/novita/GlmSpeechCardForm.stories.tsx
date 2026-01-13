import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { GlmSpeechCardForm, type NovitaGlmSpeechConfig, type NovitaSpeechConfig } from "aihappey-components";

const meta: Meta<typeof GlmSpeechCardForm> = {
  title: "Forms/Providers/Novita/SpeechCards/GLM",
  component: GlmSpeechCardForm,
};

export default meta;
type Story = StoryObj<typeof GlmSpeechCardForm>;

const Template: React.FC<{ initial: NovitaSpeechConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<NovitaSpeechConfig>(initial);
  return <GlmSpeechCardForm config={config} updateConfig={setConfig} />;
};

export const Default: Story = {
  render: () => <Template initial={{}} />,
};

export const Tongtong: Story = {
  render: () => (
    <Template
      initial={{
        glm: {
          voice: "tongtong",
          volume: 1.0,
          speed: 1.0,
        } satisfies NovitaGlmSpeechConfig,
      }}
    />
  ),
};

