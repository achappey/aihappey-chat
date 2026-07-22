import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";

import { DepazaChatConfigForm, type DepazaChatConfig } from "aihappey-components";

const meta: Meta<typeof DepazaChatConfigForm> = {
  title: "Forms/Providers/Depaza/DepazaChatConfigForm",
  component: DepazaChatConfigForm,
};

export default meta;
type Story = StoryObj<typeof DepazaChatConfigForm>;

const Wrapper = ({ config }: { config: DepazaChatConfig }) => {
  const [state, setState] = useState(config);

  return <DepazaChatConfigForm config={state} updateConfig={setState} />;
};

export const Standard: Story = {
  render: () => <Wrapper config={{ mode: "standard", depaza_events: true }} />,
};

export const Document: Story = {
  render: () => (
    <Wrapper
      config={{
        mode: "document",
        locale: "da",
        document_intake: true,
        depaza_events: true,
      }}
    />
  ),
};

export const Expert: Story = {
  render: () => <Wrapper config={{ mode: "expert", locale: "en", depaza_events: false }} />,
};
