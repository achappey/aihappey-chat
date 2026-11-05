import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { OpenAIImageConfigForm } from "aihappey-components";

const meta: Meta<typeof OpenAIImageConfigForm> = {
  title: "Forms/Providers/OpenAI/OpenAIImageConfigForm",
  component: OpenAIImageConfigForm,
};
export default meta;

type Story = StoryObj<typeof OpenAIImageConfigForm>;

const Wrapper = (props: any) => {
  const [config, setConfig] = useState(props.config ?? {});
  return <OpenAIImageConfigForm {...props} config={config} updateConfig={setConfig} />;
};

export const Default: Story = {
  render: () => <Wrapper />,
};

export const Populated: Story = {
  render: () => (
    <Wrapper
      config={{
        quality: "high",
        background: "transparent",
        moderation: "auto",
      }}
    />
  ),
};

export const GIF: Story = {
  render: () => <Wrapper config={{ output_format: "gif", complexity: "high", frame_count: 9, frame_duration_ms: 200 }} />,
};

export const SVG: Story = {
  render: () => <Wrapper config={{ output_format: "svg", svg: { model: "gpt-5.5", reasoning: { effort: "high" } } }} />,
};

export const WithTranslations: Story = {
  render: () => (
    <Wrapper
      config={{
        quality: "medium",
        background: "opaque",
        moderation: "low",
      }}
      translations={{
        formTitle: "OpenAI image settings",
        quality: "Quality",
        background: "Background",
        moderation: "Moderation",
        auto: "Auto",
        low: "Low",
        medium: "Medium",
        high: "High",
        transparent: "Transparent",
        opaque: "Opaque",
      }}
    />
  ),
};

