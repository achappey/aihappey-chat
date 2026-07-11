import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type { TranscriptionResponse } from "aihappey-ai";
import { TranscriptionDetailsModal } from "aihappey-components";

const providers = {
  openai: {
    name: "OpenAI",
    urls: { homepage: "https://openai.com" },
  },
};

const SAMPLE_TRANSCRIPTION_WITH_SEGMENTS: TranscriptionResponse = {
  text: "Hello world. This is a sample transcription.\n\nSecond paragraph.",
  segments: [
    { text: "Hello world.", startSecond: 0, endSecond: 1.2 },
    { text: "This is a sample transcription.", startSecond: 1.2, endSecond: 3.7 },
  ],
  language: "en",
  durationInSeconds: 3.7,
  warnings: [],
  providerMetadata: {
    openai: { requestId: "req-transcription-123" },
  },
  request: {
    body: JSON.stringify({
      model: "openai/gpt-4o-transcribe",
      mediaType: "audio/wav",
      providerOptions: { openai: { language: "en" } },
    }),
  },
  response: {
    timestamp: new Date("2026-01-01T12:00:00.000Z") as any,
    modelId: "openai/gpt-4o-transcribe",
    body: {
      provider: "openai",
      raw: { foo: "bar", nested: { a: 1 } },
    },
  },
};

const SAMPLE_TRANSCRIPTION_NO_SEGMENTS: TranscriptionResponse = {
  ...SAMPLE_TRANSCRIPTION_WITH_SEGMENTS,
  segments: [],
};

const SAMPLE_AUDIO = new Blob(["fake audio bytes"], { type: "audio/wav" });

type ControlledProps = Omit<
  React.ComponentProps<typeof TranscriptionDetailsModal>,
  "open" | "onClose"
> & {
  initialOpen: boolean;
};

const Controlled: React.FC<ControlledProps> = ({ initialOpen, ...args }) => {
  const [open, setOpen] = useState(initialOpen);

  return <TranscriptionDetailsModal {...args} open={open} onClose={() => setOpen(false)} />;
};

const meta = {
  title: "Modals/TranscriptionDetailsModal",
  component: TranscriptionDetailsModal,
  args: {
    open: true,
    onClose: (() => {}) as any,
    transcription: SAMPLE_TRANSCRIPTION_WITH_SEGMENTS,
    audio: SAMPLE_AUDIO,
    audioFilename: "sample.wav",
    providers,
    size: "large",
  },
  argTypes: {
    open: { control: false }, // controlled by wrapper
    onClose: { action: "close", control: false },
    transcription: { control: "object" },
    audio: { control: false },
    audioFilename: { control: "text" },
    size: { control: "radio", options: ["small", "medium", "large"] },
  },
} satisfies Meta<typeof TranscriptionDetailsModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithSegments: Story = {
  args: {
    initialOpen: true,
    transcription: SAMPLE_TRANSCRIPTION_WITH_SEGMENTS,
  } as any,
  render: (args) => <Controlled {...(args as any)} />,
};

export const WithoutSegments: Story = {
  args: {
    initialOpen: true,
    transcription: SAMPLE_TRANSCRIPTION_NO_SEGMENTS,
  } as any,
  render: (args) => <Controlled {...(args as any)} />,
};

