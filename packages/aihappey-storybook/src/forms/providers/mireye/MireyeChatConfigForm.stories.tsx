import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  MireyeChatConfigForm,
  type MireyeChatConfig,
} from "aihappey-components";

const Wrapper = ({
  initialConfig = {},
}: {
  initialConfig?: MireyeChatConfig;
}) => {
  const [config, setConfig] = useState<MireyeChatConfig>(initialConfig);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 0.65fr)",
        gap: 24,
      }}
    >
      <MireyeChatConfigForm config={config} updateConfig={setConfig} />
      <pre style={{ margin: 0, padding: 16, overflow: "auto" }}>
        {JSON.stringify({ mireye: config }, null, 2)}
      </pre>
    </div>
  );
};

const meta: Meta<typeof MireyeChatConfigForm> = {
  title: "Forms/Providers/Mireye/MireyeChatConfigForm",
  component: MireyeChatConfigForm,
};

export default meta;
type Story = StoryObj<typeof MireyeChatConfigForm>;

export const DefaultAddressMode: Story = {
  render: () => <Wrapper />,
};

export const Address: Story = {
  render: () => (
    <Wrapper initialConfig={{ address: "350 5th Ave, New York, NY 10118" }} />
  ),
};

export const Coordinates: Story = {
  render: () => <Wrapper initialConfig={{ lat: 46.6, lng: -93.7 }} />,
};
