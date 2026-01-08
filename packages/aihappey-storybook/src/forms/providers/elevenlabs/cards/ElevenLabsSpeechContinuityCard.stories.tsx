import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  ElevenLabsSpeechConfig,
  ElevenLabsSpeechContinuityCard,
} from "aihappey-components";

const meta: Meta<typeof ElevenLabsSpeechContinuityCard> = {
  title: "Forms/Providers/ElevenLabs/SpeechConfigForm/Cards/Continuity",
  component: ElevenLabsSpeechContinuityCard,
};

export default meta;
type Story = StoryObj<typeof ElevenLabsSpeechContinuityCard>;

const Template: React.FC<{ initial: ElevenLabsSpeechConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<ElevenLabsSpeechConfig>(initial);
  return (
    <ElevenLabsSpeechContinuityCard config={config} updateConfig={setConfig} />
  );
};

export const Default: Story = {
  render: () => <Template initial={{}} />,
};

