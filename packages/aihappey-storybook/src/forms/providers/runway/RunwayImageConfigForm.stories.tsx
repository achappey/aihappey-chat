import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { RunwayImageConfigForm } from "aihappey-components";

const meta: Meta<typeof RunwayImageConfigForm> = {
  title: "Forms/Providers/Runway/RunwayImageConfigForm",
  component: RunwayImageConfigForm,
};
export default meta;

type Story = StoryObj<typeof RunwayImageConfigForm>;

const Wrapper = (props: any) => {
  const [config, setConfig] = useState(props.config ?? {});
  return <RunwayImageConfigForm {...props} config={config} updateConfig={setConfig} />;
};

export const Default: Story = {
  render: () => <Wrapper />,
};

export const Populated: Story = {
  render: () => (
    <Wrapper
      config={{
        contentModeration: {
          publicFigureThreshold: "low",
        },
      }}
    />
  ),
};

export const WithTranslations: Story = {
  render: () => (
    <Wrapper
      config={{
        contentModeration: {
          publicFigureThreshold: "auto",
        },
      }}
      translations={{
        formTitle: "Runway image settings",
        publicFigureThreshold: "Public figure threshold",
        low: "Low",
        auto: "Auto",
      }}
    />
  ),
};

