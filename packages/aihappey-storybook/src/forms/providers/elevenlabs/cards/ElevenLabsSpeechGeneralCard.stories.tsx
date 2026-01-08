import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  ElevenLabsSpeechConfig,
  ElevenLabsSpeechGeneralCard,
} from "aihappey-components";

const meta: Meta<typeof ElevenLabsSpeechGeneralCard> = {
  title: "Forms/Providers/ElevenLabs/SpeechConfigForm/Cards/General",
  component: ElevenLabsSpeechGeneralCard,
};

export default meta;
type Story = StoryObj<typeof ElevenLabsSpeechGeneralCard>;

const Template: React.FC<{ initial: ElevenLabsSpeechConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<ElevenLabsSpeechConfig>(initial);
  return <ElevenLabsSpeechGeneralCard config={config} updateConfig={setConfig} />;
};

export const Default: Story = {
  render: () => <Template initial={{}} />,
};

