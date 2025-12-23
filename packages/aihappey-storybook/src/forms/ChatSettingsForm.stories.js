import React, { useState } from "react";
import { ChatSettingsForm } from "aihappey-components";

export default {
  title: "Forms/ChatSettingsForm",
  component: ChatSettingsForm,
};

const Wrapper = (props) => {
  const [value, setValue] = useState(props.value || { throttle: 100 });
  return React.createElement(ChatSettingsForm, {
    ...props,
    value: value,
    onChange: setValue,
  });
};

export const Default = () =>
  React.createElement(Wrapper, {});

export const WithTitle = () =>
  React.createElement(Wrapper, {
    formTitle: "Chat Configuration",
  });
