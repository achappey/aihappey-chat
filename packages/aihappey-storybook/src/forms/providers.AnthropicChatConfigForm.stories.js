import React, { useState } from "react";
import { AnthropicChatConfigForm } from "aihappey-components";

export default {
  title: "Forms/Providers/Anthropic/AnthropicChatConfigForm",
  component: AnthropicChatConfigForm,
};

const Wrapper = (props) => {
  const [config, setConfig] = useState(props.config ?? {});
  return React.createElement(AnthropicChatConfigForm, {
    ...props,
    config,
    updateConfig: setConfig,
  });
};

export const Default = () => React.createElement(Wrapper, {});

export const Populated = () =>
  React.createElement(Wrapper, {
    config: {
      thinking: { budget_tokens: 2048 },
      web_search: {
        max_uses: 3,
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
        max_uses: 2,
        allowed_domains: [],
        blocked_domains: ["ads.example"],
        citations: { enabled: true },
      },
      code_execution: {},
      container: {
        skills: [
          { skill_id: "xlsx", version: "latest", type: "anthropic" },
          { skill_id: "pdf", version: "latest", type: "anthropic" },
          { skill_id: "skill_custom_foo", version: "latest", type: "custom" },
        ],
      },
      memory: {},
      native_mcp: true,
    },
  });

