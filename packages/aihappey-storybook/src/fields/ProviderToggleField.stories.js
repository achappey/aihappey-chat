import React, { useState } from "react";
import { ProviderToggleField } from "aihappey-components";

export default {
  title: "Fields/ProviderToggleField",
  component: ProviderToggleField,
};

const ToggleWrapper = (props) => {
  const [checked, setChecked] = useState(props.checked || false);
  return React.createElement(ProviderToggleField, {
    ...props,
    checked: checked,
    onChange: setChecked,
  });
};

export const Default = () =>
  React.createElement(ToggleWrapper, {
    provider: "openai",
  });

export const Checked = () =>
  React.createElement(ToggleWrapper, {
    provider: "anthropic",
    checked: true,
  });

export const WithLabel = () =>
  React.createElement(ToggleWrapper, {
    provider: "azure",
    label: "Azure OpenAI",
  });
