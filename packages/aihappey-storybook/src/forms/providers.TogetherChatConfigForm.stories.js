import React, { useState } from "react";
import { TogetherChatConfigForm } from "aihappey-components";

export default {
  title: "Forms/Providers/Together/TogetherChatConfigForm",
  component: TogetherChatConfigForm,
};

const Wrapper = (props) => {
  const [config, setConfig] = useState(props.config ?? {});
  return React.createElement(TogetherChatConfigForm, {
    ...props,
    config,
    updateConfig: setConfig,
  });
};

export const Default = () => React.createElement(Wrapper, {});

export const Populated = () =>
  React.createElement(Wrapper, {
    config: {
      safety_model: "Meta-Llama/Llama-Guard-7b",
    },
  });

