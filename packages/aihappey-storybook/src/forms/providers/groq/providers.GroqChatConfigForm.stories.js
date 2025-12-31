import React, { useState } from "react";
import { GroqChatConfigForm } from "aihappey-components";

export default {
  title: "Forms/Providers/Groq/GroqChatConfigForm",
  component: GroqChatConfigForm,
};

const Wrapper = (props) => {
  const [config, setConfig] = useState(props.config ?? {});
  return React.createElement(GroqChatConfigForm, {
    ...props,
    config,
    updateConfig: setConfig,
  });
};

export const Default = () => React.createElement(Wrapper, {});

export const Populated = () =>
  React.createElement(Wrapper, {
    config: {
      reasoning_format: "parsed",
    },
  });

