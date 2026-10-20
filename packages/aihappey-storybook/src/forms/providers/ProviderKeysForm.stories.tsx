import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import {
  ProviderKeysForm,
  type ProviderKeyItem,
  type ProviderKeysFormProps,
} from "aihappey-components";

const meta: Meta<typeof ProviderKeysForm> = {
  title: "Forms/Providers/ProviderKeysForm",
  component: ProviderKeysForm,
};

export default meta;
type Story = StoryObj<typeof ProviderKeysForm>;

const baseItems: ProviderKeyItem[] = [
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

type WrapperProps = Omit<
  ProviderKeysFormProps,
  "values" | "onChange" | "onRemove"
> & {
  values?: Record<string, string | undefined>;
};

const Wrapper: React.FC<WrapperProps> = (props) => {
  const [values, setValues] = useState<Record<string, string | undefined>>(
    props.values ?? {
      Authorization: "sk-example-123",
      "X-Api-Key": "",
    }
  );

  return (
    <ProviderKeysForm
      {...props}
      values={values}
      onChange={(header, value) =>
        setValues((v) => ({ ...v, [header]: value }))
      }
      onRemove={(header) =>
        setValues((v) => ({ ...v, [header]: "" }))
      }
    />
  );
};

export const Default: Story = {
  render: () => <Wrapper items={baseItems} />,
};

export const WithTitle: Story = {
  render: () => (
    <Wrapper items={baseItems} title="Provider keys" />
  ),
};

export const SearchableProviderPicker: Story = {
  render: () => (
    <Wrapper
      title="Add a provider key"
      items={[
        ...baseItems,
        { id: "google", name: "Google AI", header: "X-Google-Key" },
        { id: "groq", name: "Groq", header: "X-Groq-Key" },
        { id: "mistral", name: "Mistral AI", header: "X-Mistral-Key" },
      ]}
      values={{ Authorization: "sk-example-123" }}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: "Click Add, open the provider dropdown, and search by provider name or header. Configured providers are excluded. Try an unmatched query to see the dropdown's empty state.",
      },
    },
  },
};

export const ManyProviders: Story = {
  render: () => (
    <Wrapper
      items={[
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
      ]}
      values={{
        Authorization: "sk-example-123",
        "X-Api-Key": "sk-example-456",
        "api-key": "sk-example-789",
        "X-Local-Key": "",
      }}
    />
  ),
};
