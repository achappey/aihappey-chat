import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { InterfazeChatConfigForm } from "aihappey-components";

const Wrapper = () => {
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [headers, setHeaders] = useState<Record<string, string> | undefined>({});

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 0.65fr)", gap: 24 }}>
      <InterfazeChatConfigForm
        config={config}
        headers={headers}
        updateConfig={setConfig}
        updateHeaders={setHeaders}
      />
      <pre style={{ margin: 0, padding: 16, overflow: "auto" }}>
        {JSON.stringify({ providerMetadata: { interfaze: config }, providerHeaders: { interfaze: headers } }, null, 2)}
      </pre>
    </div>
  );
};

const meta: Meta<typeof InterfazeChatConfigForm> = {
  title: "Forms/Providers/Interfaze/InterfazeChatConfigForm",
  component: InterfazeChatConfigForm,
  render: () => <Wrapper />,
};

export default meta;
type Story = StoryObj<typeof InterfazeChatConfigForm>;

export const Default: Story = {};
