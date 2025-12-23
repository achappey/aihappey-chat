import React, { useState } from "react";
import { ProviderSettingsForm } from "aihappey-components";

export default {
  title: "Forms/ProviderSettingsForm",
  component: ProviderSettingsForm,
};

const providers = [
  "openai",
  "anthropic",
  "azure",
  "google",
  "mistral",
  "groq",
  "ollama",
];

const Wrapper = (props) => {
  const [enabled, setEnabled] = useState(
    props.enabledProviders || ["openai", "anthropic"]
  );
  return React.createElement(ProviderSettingsForm, {
    ...props,
    providers: providers,
    enabledProviders: enabled,
    onChange: setEnabled,
  });
};

export const Default = () =>
  React.createElement(Wrapper, {});

export const WithTitle = () =>
  React.createElement(Wrapper, {
    formTitle: "AI Providers",
  });

export const CustomLabels = () =>
  React.createElement(Wrapper, {
    getProviderLabel: (p) => p.toUpperCase(),
  });
