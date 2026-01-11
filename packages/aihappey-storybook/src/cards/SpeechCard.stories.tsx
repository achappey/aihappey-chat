import type { Meta, StoryObj } from "@storybook/react";
import type { SpeechResponse } from "aihappey-ai";
import { SpeechCard } from "aihappey-components";
import type { ComponentProps } from "react";

const meta = {
  title: "Cards/SpeechCard",
  component: SpeechCard,
} satisfies Meta<typeof SpeechCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Minimal 1 second silent wav base64 (same idea as AudioCard story)
const SILENT_WAV_BASE64 = "UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
const SILENT_WAV_DATA_URI = `data:audio/wav;base64,${SILENT_WAV_BASE64}`;

// Minimal LINEAR16 PCM data URI (Google-style), 4 bytes = 2 mono samples @ 16kHz.
const PCM_DATA_URI = "data:audio/L16;codec=pcm;rate=16000;base64,AAAAAA==";

const baseResponseFields = {
  warnings: [],
  response: {
    timestamp: new Date("2026-01-01T12:00:00.000Z") as any,
    modelId: "example-model",
    body: { provider: "example" },
  },
} satisfies Omit<SpeechResponse, "audio">;

export const EmptyAudio: Story = {
  args: {
    speech: {
      ...baseResponseFields,
      audio: undefined,
    } as SpeechResponse,
  } satisfies ComponentProps<typeof SpeechCard>,
};

export const WavDataUri: Story = {
  args: {
    speech: {
      ...baseResponseFields,
      audio: SILENT_WAV_DATA_URI,
    },
  },
};

export const PcmDataUriConvertedToWav: Story = {
  args: {
    speech: {
      ...baseResponseFields,
      audio: PCM_DATA_URI,
    },
  },
};

export const WithDeleteMenu: Story = {
  args: {
    speech: {
      ...baseResponseFields,
      audio: SILENT_WAV_DATA_URI,
    },
    onDelete: () => console.log("Delete speech"),
  },
};

