import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ModelContextExtensionsSettingsForm } from "aihappey-components";

type ModelContextExtensionsSettings = {
  enableApps: boolean;
  enableAgentImport: boolean;
  enableConversationImport: boolean;
  enableMcpSkills?: boolean;
};

const Wrapper = ({
  initialValue,
}: {
  initialValue?: ModelContextExtensionsSettings;
}) => {
  const [value, setValue] = useState<ModelContextExtensionsSettings>(
    initialValue ?? {
      enableApps: false,
      enableAgentImport: false,
      enableConversationImport: false,
      enableMcpSkills: true,
    }
  );

  return (
    <ModelContextExtensionsSettingsForm
      value={value}
      onToggleApps={(enabled) =>
        setValue((prev) => ({ ...prev, enableApps: enabled }))
      }
      onToggleAgentImport={(enabled) =>
        setValue((prev) => ({ ...prev, enableAgentImport: enabled }))
      }
      onToggleConversationImport={(enabled) =>
        setValue((prev) => ({ ...prev, enableConversationImport: enabled }))
      }
      onToggleMcpSkills={(enabled) =>
        setValue((prev) => ({ ...prev, enableMcpSkills: enabled }))
      }
    />
  );
};

const meta: Meta<typeof ModelContextExtensionsSettingsForm> = {
  title: "Forms/Model Context/ModelContextExtensionsSettingsForm",
  component: ModelContextExtensionsSettingsForm,
};

export default meta;
type Story = StoryObj<typeof ModelContextExtensionsSettingsForm>;

/**
 * ALL OFF — minimal surface
 */
export const AllOff: Story = {
  render: () => <Wrapper initialValue={{ enableApps: false, enableAgentImport: false, enableConversationImport: false, enableMcpSkills: false }} />,
};

/**
 * ALL ON — full surface enabled
 */
export const AllOn: Story = {
  render: () => (
    <Wrapper
      initialValue={{
        enableApps: true,
        enableAgentImport: true,
        enableConversationImport: true,
      }}
    />
  ),
};

/**
 * MIXED — common config
 */
export const Mixed: Story = {
  render: () => (
    <Wrapper
      initialValue={{
        enableApps: true,
        enableAgentImport: false,
        enableConversationImport: true,
      }}
    />
  ),
};

/**
 * INTERACTIVE — toggle switches via UI
 */
export const Interactive: Story = {
  render: () => (
    <Wrapper
      initialValue={{
        enableApps: true,
        enableAgentImport: true,
        enableConversationImport: false,
      }}
    />
  ),
};

/** Existing consumers that do not supply the new optional props remain valid. */
export const LegacyConsumer: Story = {
  render: () => (
    <ModelContextExtensionsSettingsForm
      value={{ enableApps: true, enableAgentImport: false, enableConversationImport: false }}
      onToggleApps={() => {}}
      onToggleAgentImport={() => {}}
      onToggleConversationImport={() => {}}
    />
  ),
};
