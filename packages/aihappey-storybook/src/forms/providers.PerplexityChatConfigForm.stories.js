import React, { useState } from "react";
import { PerplexityChatConfigForm } from "aihappey-components";

export default {
  title: "Forms/Providers/Perplexity/PerplexityChatConfigForm",
  component: PerplexityChatConfigForm,
};

const Wrapper = (props) => {
  const [config, setConfig] = useState(props.config ?? {});
  return React.createElement(PerplexityChatConfigForm, {
    ...props,
    config,
    updateConfig: setConfig,
  });
};

export const Default = () => React.createElement(Wrapper, {});

export const Populated = () =>
  React.createElement(Wrapper, {
    config: {
      return_citations: true,
      search_domain_filter: ["example.com"],
    },
  });

