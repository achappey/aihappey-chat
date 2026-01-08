import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { GoogleSpeechConfig, GoogleSpeechConfigForm } from "aihappey-components";

const meta: Meta<typeof GoogleSpeechConfigForm> = {
  title: "Forms/Providers/Google/SpeechConfigForm",
  component: GoogleSpeechConfigForm,
};

export default meta;
type Story = StoryObj<typeof GoogleSpeechConfigForm>;

const Template: React.FC<{ initial: GoogleSpeechConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<GoogleSpeechConfig>(initial);
  return <GoogleSpeechConfigForm config={config} updateConfig={setConfig} />;
};

export const Default: Story = {
  render: () => <Template initial={{}} />,
};

export const SingleVoiceAndSeed: Story = {
  render: () => <Template initial={{ voice: "Zephyr", seed: 123 }} />,
};

export const MultiSpeaker: Story = {
  render: () => (
    <Template
      initial={{
        voice: "Zephyr",
        seed: 1,
        speakers: [
          { name: "Alice", voice: "Puck" },
          { name: "Bob", voice: "Kore" },
        ],
      }}
    />
  ),
};

export const UnknownVoiceValues: Story = {
  render: () => (
    <Template
      initial={{
        voice: "SomeLegacyVoice",
        speakers: [
          { name: "Alice", voice: "SomeLegacyVoice" },
          { name: "Bob", voice: "Zephyr" },
        ],
      }}
    />
  ),
};

