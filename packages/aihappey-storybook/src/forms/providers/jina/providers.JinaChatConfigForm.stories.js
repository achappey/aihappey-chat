import React, { useState } from "react";
import { JinaChatConfigForm } from "aihappey-components";

export default {
  title: "Forms/Providers/Jina/JinaChatConfigForm",
  component: JinaChatConfigForm,
};

const Wrapper = (props) => {
  const [config, setConfig] = useState(props.config ?? {});
  return React.createElement(JinaChatConfigForm, {
    ...props,
    config,
    updateConfig: setConfig,
  });
};

export const Default = () => React.createElement(Wrapper, {});

export const Populated = () =>
  React.createElement(Wrapper, {
    config: {
      grounded: true,
      web_search: { max_uses: 3 },
    },
  });

