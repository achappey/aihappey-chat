import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { TranscriptionSettingsModal } from "aihappey-components";

type ControlledProps = Omit<
  React.ComponentProps<typeof TranscriptionSettingsModal>,
  "open" | "providerMetadata" | "setProviderMetadata" | "onClose" | "resetDefaults"
> & {
  initialOpen: boolean;
  initialProviderMetadata?: Record<string, any>;
  /** Optional Storybook action hook; wrapper will call it after closing. */
  onClose?: () => void;
};

const Controlled: React.FC<ControlledProps> = ({
  initialOpen,
  initialProviderMetadata,
  ...args
}) => {
  const [open, setOpen] = useState(initialOpen);
  const [providerMetadata, setProviderMetadata] = useState<Record<string, any>>(
    initialProviderMetadata ?? {}
  );
  const [realtimeProviderMetadata, setRealtimeProviderMetadata] = useState<Record<string, any>>({});

  return (
    <TranscriptionSettingsModal
      {...(args as Omit<
        React.ComponentProps<typeof TranscriptionSettingsModal>,
        "open" | "providerMetadata" | "setProviderMetadata" | "onClose" | "resetDefaults"
      >)}
      open={open}
      providerMetadata={providerMetadata}
      setProviderMetadata={setProviderMetadata}
      realtimeProviderMetadata={realtimeProviderMetadata}
      setRealtimeProviderMetadata={setRealtimeProviderMetadata}
      resetDefaults={() => setProviderMetadata({})}
      onClose={() => {
        setOpen(false);
        args.onClose?.();
      }}
    />
  );
};

const meta = {
  title: "Modals/TranscriptionSettingsModal",
  component: TranscriptionSettingsModal,
  args: {
    open: true,
    onClose: (() => {}) as any,
    enabledProviders: ["OpenAI"],
    providerMetadata: {},
    setProviderMetadata: (() => {}) as any,
    realtimeProviderMetadata: {},
    setRealtimeProviderMetadata: (() => {}) as any,
    knownSpeakerSamples: {
      getSampleInfo: (speakerName: string) => ({
        exists: false,
        tagLabel: `No sample for ${speakerName}`,
      }),
      onUploadSample: async (speakerName: string) =>
        console.log("upload sample", speakerName),
      onClearSample: async (speakerName: string) =>
        console.log("clear sample", speakerName),
      onRenameSample: async (from: string, to: string) =>
        console.log("rename sample", { from, to }),
      onPreviewSample: async (speakerName: string) =>
        console.log("preview sample", speakerName),
    },
  },
  argTypes: {
    open: { control: false }, // controlled by wrapper
    onClose: { action: "close", control: false },
    enabledProviders: { control: "object" },
    knownSpeakerSamples: { control: false },
    providerMetadata: { control: false },
    setProviderMetadata: { control: false },
    realtimeProviderMetadata: { control: false },
    setRealtimeProviderMetadata: { control: false },
    resetDefaults: { control: false },
    onEditProviderKeys: { control: false },
  },
} satisfies Meta<typeof TranscriptionSettingsModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OpenAIOnly: Story = {
  args: {
    initialOpen: true,
    enabledProviders: ["OpenAI"],
    initialProviderMetadata: { openai: {} },
  } as any,
  render: (args) => <Controlled {...(args as any)} />,
};

export const OpenAIAndElevenLabs: Story = {
  args: {
    initialOpen: true,
    enabledProviders: ["OpenAI", "ElevenLabs"],
    initialProviderMetadata: { openai: {}, elevenlabs: {} },
  } as any,
  render: (args) => <Controlled {...(args as any)} />,
};

export const XAIOnly: Story = {
  args: {
    initialOpen: true,
    enabledProviders: ["xAI"],
    initialProviderMetadata: { xai: {} },
  } as any,
  render: (args) => <Controlled {...(args as any)} />,
};

export const MultipleProvidersScroll: Story = {
  args: {
    initialOpen: true,
    enabledProviders: [
      "OpenAI",
      "xAI",
      "ElevenLabs",
      "Fireworks",
      "Groq",
      "Gladia",
      "Mistral",
      "Novita",
      "SambaNova",
      "Scaleway",
      "Zai",
      "Telnyx",
    ],
    initialProviderMetadata: {
      openai: {},
      xai: {},
      elevenlabs: {},
      fireworks: {},
      groq: {},
      gladia: {},
      mistral: {},
      novita: {},
      sambanova: {},
      scaleway: {},
      zai: {},
      telnyx: {},
    },
  } as any,
  render: (args) => <Controlled {...(args as any)} />,
};

