import React, { useState } from "react";
import { MistralChatConfigForm } from "aihappey-components";

export default {
  title: "Forms/Providers/Mistral/MistralChatConfigForm",
  component: MistralChatConfigForm,
};

const Wrapper = (props) => {
  const [config, setConfig] = useState(props.config ?? {});
  return React.createElement(MistralChatConfigForm, {
    ...props,
    config,
    updateConfig: setConfig,
  });
};

export const Default = () => React.createElement(Wrapper, {});

export const Populated = () =>
  React.createElement(Wrapper, {
    config: {
      safe_prompt: true,
      random_seed: 42,
      response_format: { type: "json_object" },
    },
  });

