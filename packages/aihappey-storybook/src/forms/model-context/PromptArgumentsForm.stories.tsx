import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  PromptArgumentsForm,
  type PromptArgument,
} from "aihappey-components";

const meta: Meta<typeof PromptArgumentsForm> = {
  title: "Forms/Model Context/PromptArgumentsForm",
  component: PromptArgumentsForm,
};

export default meta;
type Story = StoryObj<typeof PromptArgumentsForm>;

const baseArguments: PromptArgument[] = [
  {
    name: "topic",
    required: true,
    description: "What should the prompt focus on?",
  },
  {
    name: "tone",
    required: false,
    description: "Optional. Example: friendly, formal, terse.",
  },
];

const FormWrapper = ({
  args,
  completions,
  loadingCompletions,
  pending,
  missingRequired,
  error,
}: {
  args: PromptArgument[];
  completions: Record<string, string[]>;
  loadingCompletions?: boolean;
  pending?: boolean;
  missingRequired?: boolean;
  error?: string | null;
}) => {
  const [values, setValues] = useState<Record<string, string>>({});

  return (
    <PromptArgumentsForm
      arguments={args}
      values={values}
      completions={completions}
      loadingCompletions={loadingCompletions}
      pending={pending}
      missingRequired={missingRequired}
      error={error}
      onChange={(name, value) =>
        setValues((prev) => ({ ...prev, [name]: value }))
      }
      onFilter={async (name, value) => {
        console.log("filter", name, value);
      }}
      onSubmit={() => {
        console.log("submit", values);
      }}
    />
  );
};

/**
 * DEFAULT — plain inputs
 */
export const Default: Story = {
  render: () => (
    <FormWrapper
      args={baseArguments}
      completions={{}}
    />
  ),
};

/**
 * WITH COMPLETIONS — Select + freeform
 */
export const WithCompletions: Story = {
  render: () => (
    <FormWrapper
      args={baseArguments}
      completions={{
        tone: ["friendly", "formal", "terse"],
      }}
    />
  ),
};

/**
 * LOADING — spinner only
 */
export const Loading: Story = {
  render: () => (
    <FormWrapper
      args={baseArguments}
      completions={{}}
      loadingCompletions
    />
  ),
};

/**
 * PENDING + ERROR — disabled + error shown
 */
export const PendingWithError: Story = {
  render: () => (
    <FormWrapper
      args={baseArguments}
      completions={{
        tone: ["friendly", "formal"],
      }}
      pending
      error="Unable to load completions."
    />
  ),
};
