import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  RerankingSettingsButton,
  type RerankingSettingsButtonProps,
} from "aihappey-components";

const meta: Meta<typeof RerankingSettingsButton> = {
  title: "Buttons/RerankingSettingsButton",
  component: RerankingSettingsButton,
};
export default meta;

type Story = StoryObj<typeof meta>;

type StoryArgs = Omit<
  RerankingSettingsButtonProps,
  "topN" | "setTopN" | "providerMetadata" | "setProviderMetadata" | "resetDefaults"
> & {
  initialTopN?: number;
  initialProviderMetadata?: Record<string, any>;
};

const StatefulTemplate: React.FC<StoryArgs> = ({
  initialTopN,
  initialProviderMetadata,
  ...args
}) => {
  const [topN, setTopN] = useState<number | undefined>(initialTopN);
  const [providerMetadata, setProviderMetadata] = useState<Record<string, any>>(
    initialProviderMetadata ?? {}
  );

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <RerankingSettingsButton
        {...args}
        topN={topN}
        setTopN={setTopN}
        providerMetadata={providerMetadata}
        setProviderMetadata={setProviderMetadata}
        resetDefaults={() => {
          setTopN(undefined);
          setProviderMetadata({});
        }}
      />
      <span style={{ opacity: 0.7 }}>
        Click the button to open the modal.
      </span>
    </div>
  );
};

export const Default: Story = {
  args: {},
  render: (args) => <StatefulTemplate {...args} />,
};

export const WithInitialValues: Story = {
  args: {
    topN: 10,
    providerMetadata: {
      provider: "example",
      model: "rerank-1",
    },
  },
  render: (args) => <StatefulTemplate {...args} />,
};
