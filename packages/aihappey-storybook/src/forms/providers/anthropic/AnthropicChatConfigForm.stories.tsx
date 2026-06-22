import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { AnthropicChatConfigForm } from "aihappey-components";

const meta: Meta<typeof AnthropicChatConfigForm> = {
  title: "Forms/Providers/Anthropic/AnthropicChatConfigForm",
  component: AnthropicChatConfigForm,
};
export default meta;

type Story = StoryObj<typeof AnthropicChatConfigForm>;

const Wrapper = (props: any) => {
  const [config, setConfig] = useState(props.config ?? {});
  return (
    <AnthropicChatConfigForm
      {...props}
      config={config}
      updateConfig={setConfig}
    />
  );
};

export const Default: Story = {
  render: () => <Wrapper />,
};

export const Populated: Story = {
  render: () => (
    <Wrapper
      config={{
        thinking: { budget_tokens: 2048 },
        advisor: {
          type: "advisor_20260301",
          name: "advisor",
          model: "claude-opus-4-8",
          max_uses: 2,
          max_tokens: 2048,
          caching: { type: "ephemeral", ttl: "5m" },
        },
        web_search: {
          name: "web_search",
          type: "web_search_20260318",
          max_uses: 3,
          response_inclusion: "excluded",
          allowed_domains: ["example.com"],
          blocked_domains: [],
          user_location: {
            timezone: "Europe/Amsterdam",
            country: "NL",
            region: "Noord-Holland",
            city: "Amsterdam",
          },
        },
        web_fetch: {
          name: "web_fetch",
          type: "web_fetch_20260318",
          max_uses: 2,
          response_inclusion: "excluded",
          allowed_domains: [],
          blocked_domains: ["ads.example"],
          citations: { enabled: true },
        },
        code_execution: {
          name: "code_execution",
          type: "code_execution_20260521",
        },
        container: {
          id: "container_demo_123",
          skills: [
            { skill_id: "pptx", version: "latest", type: "anthropic" },
            { skill_id: "xlsx", version: "latest", type: "anthropic" },
            { skill_id: "pdf", version: "latest", type: "anthropic" },
            { skill_id: "skill_custom_foo", type: "custom" },
          ],
        },
        memory: {}
      }}
    />
  ),
};
