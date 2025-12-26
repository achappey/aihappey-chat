import React, { useState } from "react";
import { ProviderKeysForm } from "aihappey-components";

export default {
  title: "Forms/ProviderKeysForm",
  component: ProviderKeysForm,
};

const baseItems = [
  {
    id: "openai",
    name: "OpenAI",
    header: "Authorization",
    iconSrc: "https://via.placeholder.com/24",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    header: "X-Api-Key",
    iconSrc: "https://via.placeholder.com/24",
  },
];

const Wrapper = (props) => {
  const [values, setValues] = useState(
    props.values || {
      Authorization: "sk-example-123",
      "X-Api-Key": "",
    }
  );

  return React.createElement(ProviderKeysForm, {
    ...props,
    values,
    onChange: (header, value) =>
      setValues((v) => ({
        ...v,
        [header]: value,
      })),
    onRemove: (header) =>
      setValues((v) => ({
        ...v,
        [header]: "",
      })),
  });
};

export const Default = () =>
  React.createElement(Wrapper, {
    items: baseItems,
  });

export const WithTitle = () =>
  React.createElement(Wrapper, {
    items: baseItems,
    title: "Provider keys",
  });

export const ManyProviders = () =>
  React.createElement(Wrapper, {
    items: [
      ...baseItems,
      {
        id: "azure",
        name: "Azure OpenAI",
        header: "api-key",
        iconSrc: "https://via.placeholder.com/24",
      },
      {
        id: "local",
        name: "Local",
        header: "X-Local-Key",
      },
    ],
    values: {
      Authorization: "sk-example-123",
      "X-Api-Key": "sk-example-456",
      "api-key": "sk-example-789",
      "X-Local-Key": "",
    },
  });

