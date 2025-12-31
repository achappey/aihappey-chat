import React, { useState } from "react";
import { OpenAIChatConfigForm } from "aihappey-components";

export default {
  title: "Forms/Providers/OpenAI/OpenAIChatConfigForm",
  component: OpenAIChatConfigForm,
};

const Wrapper = (props) => {
  const [config, setConfig] = useState(props.config ?? {});
  return React.createElement(OpenAIChatConfigForm, {
    ...props,
    config,
    updateConfig: setConfig,
  });
};

export const Default = () => React.createElement(Wrapper, {});

export const Populated = () =>
  React.createElement(Wrapper, {
    config: {
      reasoning: { effort: "medium", summary: "auto" },
      web_search: {
        search_context_size: "medium",
        user_location: {
          country: "NL",
          region: "Noord-Holland",
          city: "Amsterdam",
          timezone: "Europe/Amsterdam",
          type: "approximate",
        },
      },
      include: ["web_search_call.action.sources"],
      image_generation: {
        model: "gpt-image-1",
        size: "1024x1024",
        quality: "medium",
        input_fidelity: "low",
        background: "auto",
        partial_images: 2,
      },
      code_interpreter: { container: { type: "auto" } },
      native_mcp: true,
      parallel_tool_calls: true,
      instructions: "Be concise.",
    },
  });

