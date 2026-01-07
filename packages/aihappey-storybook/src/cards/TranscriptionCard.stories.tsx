import type { Meta, StoryObj } from "@storybook/react";
import type { TranscriptionResponse } from "aihappey-ai";
import React from "react";
import { TranscriptionCard } from "aihappey-components";

const SAMPLE_TRANSCRIPTION: TranscriptionResponse = {
  text: "Hello world. This is a sample transcription.\n\nSecond paragraph.",
  segments: [
    { text: "Hello world.", startSecond: 0, endSecond: 1.2 },
    { text: "This is a sample transcription.", startSecond: 1.2, endSecond: 3.7 },
  ],
  language: "en",
  durationInSeconds: 3.7,
  warnings: [],
  request: { body: "{...}" },
  response: {
    timestamp: new Date("2026-01-01T12:00:00.000Z") as any,
    modelId: "example-model",
    body: {
      provider: "example",
      raw: { foo: "bar", nested: { a: 1 } },
    },
  },
};

const SAMPLE_AUDIO = new Blob(["fake audio bytes"], { type: "audio/wav" });

const meta = {
  title: "Cards/TranscriptionCard",
  component: TranscriptionCard,
  args: {
    filename: "sample.wav",
    file: SAMPLE_AUDIO,
    transcription: SAMPLE_TRANSCRIPTION,
  },
} satisfies Meta<typeof TranscriptionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithModalOpen: Story = {
  args: {
    // This story exists to show the modal actions (Download SplitButton + Close).
    // Note: The modal opens via the view action button.
  },
};

