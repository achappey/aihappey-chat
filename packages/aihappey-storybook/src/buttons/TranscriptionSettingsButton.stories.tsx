import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { TranscriptionSettingsButton } from "aihappey-components";

const noop = () => { };
const baseArgs: React.ComponentProps<typeof TranscriptionSettingsButton> = {
  enabledProviders: ["OpenAI"],
  providerMetadata: { openai: {} },
  setProviderMetadata: noop,
};

const meta = {
  title: "Buttons/TranscriptionSettingsButton",
  component: TranscriptionSettingsButton,
  args: baseArgs,
} satisfies Meta<typeof TranscriptionSettingsButton>;

export default meta;
type Story = StoryObj<typeof meta>;

type Props = React.ComponentProps<typeof TranscriptionSettingsButton>;

const box: React.CSSProperties = {
  padding: 12,
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 8,
};

const Wrapper: React.FC<{
  initialProviders?: Props["enabledProviders"];
  initialProviderMetadata?: Props["providerMetadata"];
  withKnownSpeakerSamples?: boolean;
}> = ({
  initialProviders = ["OpenAI"],
  initialProviderMetadata = { openai: {} },
  withKnownSpeakerSamples = false,
}) => {
    const [providerMetadata, setProviderMetadata] = useState(initialProviderMetadata);

    const knownSpeakerSamples: Props["knownSpeakerSamples"] | undefined =
      withKnownSpeakerSamples
        ? {
          getSampleInfo: (speakerName) => {
            const exists = speakerName.toLowerCase().includes("alice");
            return {
              exists,
              tagLabel: exists ? "sample uploaded" : "no sample",
            };
          },
          onUploadSample: async (speakerName, files) => {
            console.log("Upload sample", speakerName, files);
          },
          onClearSample: async (speakerName) => {
            console.log("Clear sample", speakerName);
          },
          onRenameSample: async (fromSpeakerName, toSpeakerName) => {
            console.log("Rename sample", { fromSpeakerName, toSpeakerName });
          },
          onPreviewSample: async (speakerName) => {
            console.log("Preview sample", speakerName);
          },
        }
        : undefined;

    return (
      <TranscriptionSettingsButton
        enabledProviders={initialProviders}
        providerMetadata={providerMetadata}
        setProviderMetadata={(meta) => {
          console.log("setProviderMetadata", meta);
          setProviderMetadata(meta);
        }}
        resetDefaults={() => {
          console.log("resetDefaults");
          setProviderMetadata(initialProviderMetadata);
        }}
        knownSpeakerSamples={knownSpeakerSamples}
      />
    );
  };

export const Default: Story = {
  args: baseArgs,
  render: () => <Wrapper />,
};

export const WithMultipleProviders: Story = {
  args: baseArgs,
  render: () => <Wrapper initialProviders={["OpenAI", "ElevenLabs", "Groq"]} />,
};

export const WithKnownSpeakerSamples: Story = {
  args: baseArgs,
  render: () => <Wrapper withKnownSpeakerSamples={true} />,
};

