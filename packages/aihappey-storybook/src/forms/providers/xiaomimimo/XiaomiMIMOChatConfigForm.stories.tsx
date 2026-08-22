import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { XiaomiMIMOChatConfigForm, type XiaomiMIMOChatConfig } from "aihappey-components";

const Wrapper = () => {
  const [config, setConfig] = useState<XiaomiMIMOChatConfig>({
    thinking: {
      type: "enabled",
    },
    tools: [
      {
        type: "web_search",
        force_search: "false",
        max_keyword: 5,
        limit: 5,
        user_location: {
          type: "approximate",
          country: "NL",
          region: "Noord-Holland",
          city: "Amsterdam",
        },
      },
    ],
  });

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <XiaomiMIMOChatConfigForm config={config} updateConfig={setConfig} />
      <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(config, null, 2)}</pre>
    </div>
  );
};

const meta: Meta<typeof XiaomiMIMOChatConfigForm> = {
  title: "Forms/Providers/XiaomiMIMO/XiaomiMIMOChatConfigForm",
  component: XiaomiMIMOChatConfigForm,
  render: () => <Wrapper />,
};

export default meta;
type Story = StoryObj<typeof XiaomiMIMOChatConfigForm>;

export const Default: Story = {};

