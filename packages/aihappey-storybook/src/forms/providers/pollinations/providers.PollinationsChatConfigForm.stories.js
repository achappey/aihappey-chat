import React, { useState } from "react";
import { PollinationsChatConfigForm } from "aihappey-components";

export default {
  title: "Forms/Providers/Pollinations/PollinationsChatConfigForm",
  component: PollinationsChatConfigForm,
};

const Wrapper = (props) => {
  const [config, setConfig] = useState(props.config ?? {});
  return React.createElement(PollinationsChatConfigForm, {
    ...props,
    config,
    updateConfig: setConfig,
  });
};

export const Default = () => React.createElement(Wrapper, {});

export const Populated = () =>
  React.createElement(Wrapper, {
    config: {
      seed: 123,
      json: true,
    },
  });

