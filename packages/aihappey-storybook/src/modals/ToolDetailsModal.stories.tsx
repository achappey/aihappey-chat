import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ToolDetailsModal } from "aihappey-components";

type ControlledProps = Omit<
  React.ComponentProps<typeof ToolDetailsModal>,
  "open" | "onClose"
> & {
  initialOpen: boolean;
  /** Optional Storybook action hook; wrapper will call it after closing. */
  onClose?: () => void;
};

const Controlled: React.FC<ControlledProps> = ({ initialOpen, ...args }) => {
  const [open, setOpen] = useState(initialOpen);

  return (
    <ToolDetailsModal
      {...(args as Omit<React.ComponentProps<typeof ToolDetailsModal>, "open" | "onClose">)}
      open={open}
      onClose={() => {
        setOpen(false);
        args.onClose?.();
      }}
    />
  );
};

const SAMPLE_INPUT_SCHEMA = {
  type: "object",
  properties: {
    query: { type: "string", description: "Search query" },
    limit: { type: "number", minimum: 1, maximum: 50, default: 10 },
  },
  required: ["query"],
};

const ControlledWithExecute: React.FC<ControlledProps> = ({ initialOpen, ...args }) => {
  const [open, setOpen] = useState(initialOpen);
  const [output, setOutput] = useState<any>(undefined);
  const [executing, setExecuting] = useState(false);

  return (
    <ToolDetailsModal
      {...(args as Omit<React.ComponentProps<typeof ToolDetailsModal>, "open" | "onClose">)}
      open={open}
      output={output}
      executing={executing}
      onExecute={async (toolName, toolArgs) => {
        setExecuting(true);
        try {
          const result = {
            toolName,
            toolArgs,
            at: new Date().toISOString(),
            ok: true,
          };
          setOutput(result);
          return result;
        } finally {
          setExecuting(false);
        }
      }}
      onClose={() => {
        setOpen(false);
        args.onClose?.();
      }}
    />
  );
};

const meta = {
  title: "Modals/ToolDetailsModal",
  component: ToolDetailsModal,
  args: {
    open: true,
    onClose: (() => {}) as any,
    name: "search",
    title: "Search",
    description: "Searches the knowledge base for relevant documents.",
    enabled: true,
    source: "plugin",
    sourceDetail: "example-server • tools/search",
    inputSchema: SAMPLE_INPUT_SCHEMA,
    size: "large",
  },
  argTypes: {
    open: { control: false }, // controlled by wrapper
    onClose: { action: "close", control: false },
    name: { control: "text" },
    title: { control: "text" },
    description: { control: "text" },
    enabled: { control: "boolean" },
    source: { control: "radio", options: ["mcp", "local", "builtin"] },
    sourceDetail: { control: "text" },
    inputSchema: { control: "object" },
    annotations: { control: "object" },
    size: { control: "radio", options: ["small", "medium", "large"] },
  },
} satisfies Meta<typeof ToolDetailsModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithDescriptionAndInputSchema: Story = {
  args: {
    initialOpen: true,
    description: "Searches the knowledge base for relevant documents.",
    inputSchema: SAMPLE_INPUT_SCHEMA,
  } as any,
  render: (args) => <Controlled {...(args as any)} />,
};

export const WithExecuteAndOutput: Story = {
  args: {
    initialOpen: true,
    description: "Try filling in the required field and click Execute.",
    inputSchema: SAMPLE_INPUT_SCHEMA,
  } as any,
  render: (args) => <ControlledWithExecute {...(args as any)} />,
};

export const InputOnly: Story = {
  args: {
    initialOpen: true,
    description: undefined,
    inputSchema: SAMPLE_INPUT_SCHEMA,
  } as any,
  render: (args) => <Controlled {...(args as any)} />,
};

export const DescriptionOnly: Story = {
  args: {
    initialOpen: true,
    description: "Tool has no structured input schema; it only accepts freeform text.",
    inputSchema: undefined,
  } as any,
  render: (args) => <Controlled {...(args as any)} />,
};

export const WithAnnotationsAndDisabled: Story = {
  args: {
    initialOpen: true,
    name: "delete-file",
    title: "Delete file",
    description: "Deletes a file from storage.",
    enabled: false,
    annotations: {
      destructiveHint: true,
      idempotentHint: false,
      readOnlyHint: false,
      openWorldHint: false,
    },
    inputSchema: {
      type: "object",
      properties: {
        uri: { type: "string" },
      },
      required: ["uri"],
    },
    size: "medium",
  } as any,
  render: (args) => <Controlled {...(args as any)} />,
};

