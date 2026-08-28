import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { CopilotChatConfigForm } from "aihappey-components";

type WrapperProps = {
  initialConfig?: any;
};

const Wrapper: React.FC<WrapperProps> = ({ initialConfig }) => {
  const [config, setConfig] = useState<any>(initialConfig ?? {});

  return <CopilotChatConfigForm config={config} updateConfig={setConfig} />;
};

const meta: Meta<typeof CopilotChatConfigForm> = {
  title: "Forms/Providers/Copilot/CopilotChatConfigForm",
  component: CopilotChatConfigForm,
};

export default meta;

type Story = StoryObj<typeof CopilotChatConfigForm>;

export const Default: Story = {
  render: () => <Wrapper />,
};

export const FullyPopulated: Story = {
  render: () => (
    <Wrapper
      initialConfig={{
        locationHint: {
          timeZone: "America/New_York",
          countryOrRegion: "US",
          countryOrRegionConfidence: 0.95,
          latitude: 40.7128,
          longitude: -74.006,
        },
        contextualResources: {
          files: [
            {
              uri: "https://contoso.sharepoint.com/sites/Engineering/Shared%20Documents/Specs/Business-Model.docx",
            },
          ],
          webContext: {
            isWebEnabled: false,
          },
        },
        additionalContext: [
          {
            text: "John Doe's birthday is on January 1st.",
          },
        ],
      }}
    />
  ),
};

