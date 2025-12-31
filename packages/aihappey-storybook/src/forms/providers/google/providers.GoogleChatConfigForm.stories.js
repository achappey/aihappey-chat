import React, { useState } from "react";
import { GoogleChatConfigForm } from "aihappey-components";

export default {
  title: "Forms/Providers/Google/GoogleChatConfigForm",
  component: GoogleChatConfigForm,
};

const Wrapper = (props) => {
  const [config, setConfig] = useState(props.config ?? {});
  return React.createElement(GoogleChatConfigForm, {
    ...props,
    config,
    updateConfig: setConfig,
  });
};

export const Default = () => React.createElement(Wrapper, {});

export const Populated = () =>
  React.createElement(Wrapper, {
    config: {
      safety_settings: {
        harassment: "block_only_high",
        hate_speech: "block_only_high",
        sexually_explicit: "block_only_high",
        dangerous_content: "block_only_high",
      },
      thinking: { budget_tokens: 1024 },
      use_google_search: true,
    },
  });

