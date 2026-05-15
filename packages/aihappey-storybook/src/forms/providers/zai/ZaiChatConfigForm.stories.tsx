import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { ZaiChatConfigForm, type ZaiChatConfig } from "aihappey-components";

const meta: Meta<typeof ZaiChatConfigForm> = {
  title: "Forms/Providers/Zai/ChatConfigForm",
  component: ZaiChatConfigForm,
};

export default meta;
type Story = StoryObj<typeof ZaiChatConfigForm>;

const Template: React.FC<{ initial: ZaiChatConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<ZaiChatConfig>(initial);
  return <ZaiChatConfigForm config={config} updateConfig={setConfig} />;
};

export const Default: Story = {
  render: () => <Template initial={{}} />,
};

export const Populated: Story = {
  render: () => (
    <Template
      initial={{
        thinking: {
          type: "enabled",
          clear_thinking: true,
        },
        tool_stream: true,
        tools: [
          {
            type: "web_search",
            web_search: {
              enable: true,
              search_engine: "search_pro_jina",
              search_query: "latest GLM 5.1 model release notes",
              count: 10,
              search_domain_filter: "docs.z.ai",
              search_recency_filter: "oneMonth",
              content_size: "high",
              result_sequence: "after",
              search_result: true,
              require_search: false,
              search_prompt: "Answer using concise and authoritative search summaries.",
            },
          },
        ],
      }}
    />
  ),
};

