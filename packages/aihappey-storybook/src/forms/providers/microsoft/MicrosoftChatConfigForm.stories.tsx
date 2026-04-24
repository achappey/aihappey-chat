import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { MicrosoftChatConfigForm } from "aihappey-components";

type WrapperProps = {
  initialConfig?: any;
};

const Wrapper: React.FC<WrapperProps> = ({ initialConfig }) => {
  const [config, setConfig] = useState<any>(initialConfig ?? {});

  return <MicrosoftChatConfigForm config={config} updateConfig={setConfig} />;
};

const meta: Meta<typeof MicrosoftChatConfigForm> = {
  title: "Forms/Providers/Microsoft/MicrosoftChatConfigForm",
  component: MicrosoftChatConfigForm,
};

export default meta;

type Story = StoryObj<typeof MicrosoftChatConfigForm>;

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

