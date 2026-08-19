import React, { useEffect, useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type { ModelOption } from "aihappey-types";
import { ModelSelectField } from "aihappey-components";

type ControlledProps = Omit<React.ComponentProps<typeof ModelSelectField>, "value" | "onChange"> & {
  initialValue: string;
};

const Controlled: React.FC<ControlledProps> = ({ initialValue, ...args }) => {
  const [value, setValue] = useState<string>(initialValue);

  // Keep state in sync when switching stories / using controls.
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return <ModelSelectField {...args} value={value} onChange={(id) => setValue(id)} />;
};

const PROVIDERS = [
  { key: "openai", label: "OpenAI" },
  { key: "anthropic", label: "Anthropic" },
  { key: "ollama", label: "Ollama" },
  { key: "azure", label: "Azure OpenAI" },
] as const;

const MODELS: ModelOption[] = [
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    type: "language",
    owned_by: "openai",
    tags: ["recommended"],
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o mini",
    type: "language",
    owned_by: "openai",
    tags: ["fast"],
  },
  {
    id: "anthropic/claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    type: "language",
    owned_by: "anthropic",
    tags: [],
  },
  {
    id: "anthropic/claude-3-5-haiku",
    name: "Claude 3.5 Haiku",
    type: "language",
    owned_by: "anthropic",
    tags: [],
  },
  {
    id: "ollama/llama3.1:8b",
    name: "Llama 3.1 8B",
    type: "language",
    owned_by: "ollama",
    tags: ["local"],
  },
  {
    id: "azure/gpt-4o-deployment",
    name: "Azure GPT-4o (deployment)",
    type: "language",
    owned_by: "azure",
    tags: [],
  },
  // This one is intentionally *not* in the provider list, so it renders ungrouped.
  {
    id: "custom/experimental-model",
    name: "Experimental (ungrouped)",
    type: "language",
    owned_by: "custom",
    tags: ["experimental"],
  },
  // Non-language example to demonstrate modelTypes filtering.
  {
    id: "openai/text-embedding-3-large",
    name: "Text Embedding 3 Large",
    type: "embedding",
    owned_by: "openai",
    tags: ["embedding"],
  },
];

const meta = {
  title: "Fields/ModelSelectField",
  component: ModelSelectField,
  args: {
    providers: PROVIDERS as any,
    models: MODELS,
    // Provide required props on the *real* component type so StoryObj typing works.
    // (The stories render a Controlled wrapper which owns the state.)
    value: "",
    onChange: () => {},
    icon: "brain",
    placeholder: "Select a model",
    size: "large",
    disabled: false,
    label: undefined,
    minWidth: 320,
    ariaLabel: "Model",
    searchable: false,
  },
  argTypes: {
    size: { control: "select", options: ["small", "medium", "large"] },
    disabled: { control: "boolean" },
    icon: { control: "text" },
    label: { control: "text" },
    placeholder: { control: "text" },
    minWidth: { control: "number" },
    ariaLabel: { control: "text" },
    searchable: { control: "boolean" },

    // Complex values / controlled state:
    models: { control: false },
    providers: { control: false },
    onChange: { control: false },
    value: { control: false },
    enabledProviderKeys: { control: false },
    modelTypes: { control: false },
    style: { control: false },
  },
} satisfies Meta<typeof ModelSelectField>;

export default meta;
type Story = StoryObj<typeof meta>;

const firstLanguageModelId = MODELS.find((m) => m.type === "language")?.id ?? MODELS[0]?.id ?? "";

export const DefaultGrouped: Story = {
  args: {
    // ensures the initial selection exists in the default "language" filter
    initialValue: firstLanguageModelId,
  } as any,
  render: (args) => <Controlled {...(args as any)} />,
};

export const FilterByProvider: Story = {
  args: {
    initialValue: "openai/gpt-4o",
    enabledProviderKeys: ["openai"],
    label: "Provider-filtered",
  } as any,
  render: (args) => <Controlled {...(args as any)} />,
};

export const Searchable: Story = {
  args: {
    initialValue: firstLanguageModelId,
    label: "Searchable model select",
    searchable: true,
  } as any,
  render: (args) => <Controlled {...(args as any)} />,
};

export const FilterByModelType: Story = {
  args: {
    initialValue: "openai/text-embedding-3-large",
    modelTypes: ["embedding"],
    label: "Embeddings only",
  } as any,
  render: (args) => <Controlled {...(args as any)} />,
};

export const DuplicateIdsAcrossModelTypes: Story = {
  args: {
    initialValue: "openai/shared-model",
    models: [
      {
        id: "openai/shared-model",
        name: "Shared language model",
        type: "language",
        owned_by: "openai",
      },
      {
        id: "openai/shared-model",
        name: "Shared image model",
        type: "image",
        owned_by: "openai",
      },
    ],
    modelTypes: ["language", "image"],
    label: "Duplicate IDs across model types",
  } as any,
  render: (args) => <Controlled {...(args as any)} />,
};

export const Disabled: Story = {
  args: {
    initialValue: "anthropic/claude-3-5-sonnet",
    disabled: true,
    label: "Disabled",
  } as any,
  render: (args) => <Controlled {...(args as any)} />,
};

export const WithLabelAndPlaceholder: Story = {
  args: {
    initialValue: "",
    label: "Model",
    placeholder: "Choose a model…",
  } as any,
  render: (args) => <Controlled {...(args as any)} />,
};

export const SizesSmallMediumLarge: Story = {
  render: () => {
    // Use memo to keep initial values stable across story rerenders.
    const initial = useMemo(() => firstLanguageModelId, []);

    return (
      <div style={{ display: "grid", gap: 16 }}>
        <Controlled
          models={MODELS}
          providers={PROVIDERS as any}
          initialValue={initial}
          label="Small"
          size="small"
          minWidth={320}
        />
        <Controlled
          models={MODELS}
          providers={PROVIDERS as any}
          initialValue={initial}
          label="Medium"
          size="medium"
          minWidth={320}
        />
        <Controlled
          models={MODELS}
          providers={PROVIDERS as any}
          initialValue={initial}
          label="Large"
          size="large"
          minWidth={320}
        />
      </div>
    );
  },
};

