import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ClientCapabilitiesForm } from "aihappey-components";

type Capabilities = Record<string, any> | undefined;

const Wrapper = ({ initial }: { initial?: Capabilities }) => {
  const [capabilities, setCapabilities] = useState<Capabilities>(initial);

  return (
    <ClientCapabilitiesForm
      capabilities={capabilities}
      onChange={(key, value) => {
        setCapabilities((prev) => {
          const next: Record<string, any> = { ...(prev ?? {}) };
          if (value == null) delete next[key];
          else next[key] = value;
          return Object.keys(next).length ? next : undefined;
        });
      }}
    />
  );
};

const meta = {
  title: "Forms/Model Context/ClientCapabilitiesForm",
  component: ClientCapabilitiesForm,
  args: {
    // Required by component typing; real interaction is handled in Wrapper.
    capabilities: undefined,
    onChange: (() => {}) as any,
  },
} satisfies Meta<typeof ClientCapabilitiesForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {} as any,
  render: () => <Wrapper initial={undefined} />,
};

export const SamplingOn: Story = {
  args: {} as any,
  render: () => <Wrapper initial={{ sampling: {} }} />,
};

export const ElicitationOn: Story = {
  args: {} as any,
  render: () => <Wrapper initial={{ elicitation: {} }} />,
};

export const BothOn: Story = {
  args: {} as any,
  render: () => <Wrapper initial={{ sampling: {}, elicitation: {} }} />,
};

