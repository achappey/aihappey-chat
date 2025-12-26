import React, { useState } from "react";
import { AiChatSettingsForm } from "aihappey-components";

export default {
  title: "Forms/AiChatSettingsForm",
  component: AiChatSettingsForm,
};

const Wrapper = (props) => {
  const [value, setValue] = useState(props.value || { temperature: 0.7 });
  return React.createElement(AiChatSettingsForm, {
    ...props,
    value: value,
    onChange: setValue,
  });
};

export const Default = () =>
  React.createElement(Wrapper, {});

export const WithTitle = () =>
  React.createElement(Wrapper, {
    formTitle: "AI Configuration",
  });
