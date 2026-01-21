import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  ElevenLabsSpeechConfig,
  ElevenLabsSpeechDialogueCard,
} from "aihappey-components";

const meta: Meta<typeof ElevenLabsSpeechDialogueCard> = {
  title: "Forms/Providers/ElevenLabs/SpeechConfigForm/Cards/Dialogue",
  component: ElevenLabsSpeechDialogueCard,
};

export default meta;
type Story = StoryObj<typeof ElevenLabsSpeechDialogueCard>;

const Template: React.FC<{ initial: ElevenLabsSpeechConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<ElevenLabsSpeechConfig>(initial);
  return <ElevenLabsSpeechDialogueCard config={config} updateConfig={setConfig} />;
};

export const Default: Story = {
  render: () => <Template initial={{}} />,
};

export const WithDialogue: Story = {
  render: () => (
    <Template
      initial={{
        dialogue: {
          inputs: [
            { voice_id: "JBFqnCBsd6RMkjVDRZzb", text: "Hello, welcome." },
            { voice_id: "21m00Tcm4TlvDq8ikWAM", text: "Thanks! Let’s begin." },
          ],
          settings: { stability: 0.55 },
        },
      }}
    />
  ),
};

