import React, { useState } from "react";
import { CohereChatConfigForm } from "aihappey-components";

export default {
  title: "Forms/Providers/Cohere/CohereChatConfigForm",
  component: CohereChatConfigForm,
};

const Wrapper = (props) => {
  const [config, setConfig] = useState(props.config ?? {});
  return React.createElement(CohereChatConfigForm, {
    ...props,
    config,
    updateConfig: setConfig,
  });
};

export const Default = () => React.createElement(Wrapper, {});

export const Populated = () =>
  React.createElement(Wrapper, {
    config: {
      safety_mode: "none",
      prompt_truncation: "auto",
    },
  });

