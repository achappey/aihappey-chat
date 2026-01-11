import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import {
  NebiusImageConfigForm,
  type NebiusImageConfig,
} from "aihappey-components";

const meta: Meta<typeof NebiusImageConfigForm> = {
  title: "Forms/Providers/Nebius/NebiusImageConfigForm",
  component: NebiusImageConfigForm,
};

export default meta;
type Story = StoryObj<typeof NebiusImageConfigForm>;

const Wrapper: React.FC<{ initial?: NebiusImageConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<NebiusImageConfig>(initial ?? {});
  return <NebiusImageConfigForm config={config} updateConfig={setConfig} />;
};

export const Default: Story = {
  render: () => <Wrapper />,
};

export const Filled: Story = {
  render: () => (
    <Wrapper
      initial={{
        num_inference_steps: 30,
        guidance_scale: 7.5,
        response_extension: "webp",
        negative_prompt: "blurry, low quality",
      }}
    />
  ),
};

export const ClampMinMax: Story = {
  render: () => (
    <Wrapper
      initial={{
        // If user types outside bounds, the form clamps (1..80 and 0..100).
        num_inference_steps: 80,
        guidance_scale: 100,
      }}
    />
  ),
};

export const LongNegativePromptTruncation: Story = {
  render: () => (
    <Wrapper
      initial={{
        negative_prompt: Array.from({ length: 2100 })
          .map(() => "x")
          .join(""),
      }}
    />
  ),
};

export const ResponseExtensionVariants: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 16 }}>
      <Wrapper initial={{ response_extension: undefined }} />
      <Wrapper initial={{ response_extension: "jpg" }} />
      <Wrapper initial={{ response_extension: "png" }} />
      <Wrapper initial={{ response_extension: "webp" }} />
    </div>
  ),
};

