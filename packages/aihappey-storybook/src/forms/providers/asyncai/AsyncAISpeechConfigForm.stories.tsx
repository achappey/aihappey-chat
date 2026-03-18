import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import {
  AsyncSpeechConfigForm,
  type AsyncSpeechConfig,
} from "aihappey-components";

const meta: Meta<typeof AsyncSpeechConfigForm> = {
  title: "Forms/Providers/Async/AsyncSpeechConfigForm",
  component: AsyncSpeechConfigForm,
};

export default meta;
type Story = StoryObj<typeof AsyncSpeechConfigForm>;

const Wrapper: React.FC<{ initial?: AsyncSpeechConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<AsyncSpeechConfig>(initial ?? {});
  return <AsyncSpeechConfigForm config={config} updateConfig={setConfig} />;
};

export const Default: Story = {
  render: () => <Wrapper />,
};

export const Filled: Story = {
  render: () => (
    <Wrapper
      initial={{
        voice: { mode: "id", id: "e0f39dc4-f691-4e78-bba5-5c636692cc04" },
        output_format: {
          container: "wav",
          encoding: "pcm_s16le",
          sample_rate: 44100,
        },
        language: "en",
      }}
    />
  ),
};

export const OutputFormatMp3: Story = {
  render: () => (
    <Wrapper
      initial={{
        output_format: {
          container: "mp3",
          bit_rate: 192000,
          // encoding is ignored for mp3; form should disable the field.
          encoding: "pcm_s16le",
        },
      }}
    />
  ),
};

export const OutputFormatRawWithEncoding: Story = {
  render: () => (
    <Wrapper
      initial={{
        output_format: {
          container: "raw",
          encoding: "pcm_f32le",
          sample_rate: 48000,
          // bit_rate is mp3-only; form should keep it cleared/disabled when not mp3.
          bit_rate: 192000,
        },
      }}
    />
  ),
};

export const SpeedControlEnabled: Story = {
  render: () => (
    <Wrapper
      initial={{
        speed_control: 1.35,
      }}
    />
  ),
};

export const StabilityEnabled: Story = {
  render: () => (
    <Wrapper
      initial={{
        stability: 65,
      }}
    />
  ),
};

export const BoundaryValues: Story = {
  render: () => (
    <Wrapper
      initial={{
        output_format: {
          container: "wav",
          encoding: "pcm_s16le",
          sample_rate: 8000,
        },
        speed_control: 0.7,
        stability: 100,
      }}
    />
  ),
};

