import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  ElevenLabsSpeechConfig,
  ElevenLabsSpeechTextNormalizationCard,
} from "aihappey-components";

const meta: Meta<typeof ElevenLabsSpeechTextNormalizationCard> = {
  title: "Forms/Providers/ElevenLabs/SpeechConfigForm/Cards/TextNormalization",
  component: ElevenLabsSpeechTextNormalizationCard,
};

export default meta;
type Story = StoryObj<typeof ElevenLabsSpeechTextNormalizationCard>;

const Template: React.FC<{ initial: ElevenLabsSpeechConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<ElevenLabsSpeechConfig>(initial);
  return (
    <ElevenLabsSpeechTextNormalizationCard
      config={config}
      updateConfig={setConfig}
    />
  );
};

export const Default: Story = {
  render: () => <Template initial={{}} />,
};

