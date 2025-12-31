import React, { useState } from "react";
import { XAIChatConfigForm } from "aihappey-components";

export default {
  title: "Forms/Providers/XAI/XAIChatConfigForm",
  component: XAIChatConfigForm,
};

const Wrapper = (props) => {
  const [config, setConfig] = useState(props.config ?? {});
  return React.createElement(XAIChatConfigForm, {
    ...props,
    config,
    updateConfig: setConfig,
  });
};

export const Default = () => React.createElement(Wrapper, {});

export const Populated = () =>
  React.createElement(Wrapper, {
    config: {
      reasoning_effort: "high",
    },
  });

