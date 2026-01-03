import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import {
  ProviderSettingsForm,
  type ProviderSettingsFormProps,
} from "aihappey-components";

const meta: Meta<typeof ProviderSettingsForm> = {
  title: "Forms/Providers/ProviderSettingsForm",
  component: ProviderSettingsForm,
};

export default meta;
type Story = StoryObj<typeof ProviderSettingsForm>;

const providers: string[] = [
  "openai",
  "anthropic",
  "azure",
  "google",
  "mistral",
  "groq",
  "ollama",
];

type WrapperProps = Omit<
  ProviderSettingsFormProps,
  "providers" | "enabledProviders" | "onChange"
> & {
  enabledProviders?: string[];
};

const Wrapper: React.FC<WrapperProps> = (props) => {
  const [enabled, setEnabled] = useState<string[]>(
    props.enabledProviders ?? ["openai", "anthropic"]
  );

  return (
    <ProviderSettingsForm
      {...props}
      providers={providers}
      enabledProviders={enabled}
      onChange={setEnabled}
    />
  );
};

export const Default: Story = {
  render: () => <Wrapper />,
};

export const WithTitle: Story = {
  render: () => <Wrapper formTitle="AI Providers" />,
};

export const CustomLabels: Story = {
  render: () => (
    <Wrapper getProviderLabel={(p) => p.toUpperCase()} />
  ),
};

export const ThreeColumns: Story = {
  render: () => <Wrapper columns={3} />,
};

export const Unsorted: Story = {
  render: () => <Wrapper sort={false} />,
};
