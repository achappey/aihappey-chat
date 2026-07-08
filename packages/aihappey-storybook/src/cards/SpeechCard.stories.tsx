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
const OPENAI_ICON_DATA_URI = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='8' fill='%2310a37f'/%3E%3Ctext x='20' y='25' text-anchor='middle' font-size='14' font-family='Arial' fill='white'%3EOAI%3C/text%3E%3C/svg%3E";

const providers = {
  openai: {
    name: "OpenAI",
    icons: [{ src: OPENAI_ICON_DATA_URI }],
    urls: { homepage: "https://openai.com" },
  },
};

const baseResponseFields = {
  warnings: [],
  response: {
    timestamp: new Date("2026-01-01T12:00:00.000Z") as any,
    modelId: "example-model",
    body: { provider: "example" },
  },
} satisfies Omit<SpeechResponse, "audio">;

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

export const WithDownloadMenu: Story = {
  args: {
    speech: {
      ...baseResponseFields,
      audio: SILENT_WAV_DATA_URI,
    },
  },
};

export const WithRequestMenu: Story = {
  args: {
    speech: {
      ...baseResponseFields,
      request: {
        body: {
          language: "auto",
          text: "The quick brown fox jumps over the lazy dog.",
          voice_id: "altair",
        },
      },
      audio: SILENT_WAV_DATA_URI,
    },
  },
};

export const WithAllMenuActions: Story = {
  args: {
    speech: {
      ...baseResponseFields,
      request: {
        body: {
          language: "auto",
          text: "The quick brown fox jumps over the lazy dog.",
          voice_id: "altair",
        },
      },
      audio: SILENT_WAV_DATA_URI,
    },
    onDelete: () => console.log("Delete speech"),
  },
};

export const WithNonObjectRequestBody: Story = {
  args: {
    speech: {
      ...baseResponseFields,
      request: {
        body: "request body is not a JSON object",
      },
      audio: SILENT_WAV_DATA_URI,
    },
  },
};

export const WithGatewayCost: Story = {
  args: {
    speech: {
      ...baseResponseFields,
      providerMetadata: {
        gateway: { cost: 0.00132 },
      },
      audio: SILENT_WAV_DATA_URI,
    },
  },
};

export const WithProviderLogoAndGatewayCost: Story = {
  args: {
    providers,
    speech: {
      ...baseResponseFields,
      providerMetadata: {
        gateway: { cost: 0.00132 },
        openai: {},
      },
      audio: SILENT_WAV_DATA_URI,
    },
  },
};

export const WithOptionalMetadataFallback: Story = {
  args: {
    providers,
    speech: {
      ...baseResponseFields,
      providerMetadata: {
        gateway: {},
        unknownprovider: {},
      },
      audio: SILENT_WAV_DATA_URI,
    },
  },
};
