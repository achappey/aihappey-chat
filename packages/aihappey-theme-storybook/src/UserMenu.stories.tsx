import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme } from "aihappey-types";

type UserMenuStoryArgs = {
  email?: string;
  showApiKeysItem?: boolean;
  providersDisabled?: boolean;
};

const UserMenuStory = (args: UserMenuStoryArgs) => {
  const { UserMenu } = useTheme() as unknown as Pick<AihUiTheme, "UserMenu">;
  return (
    <UserMenu
      {...args}
      onCustomize={() => console.log("UserMenu: customize")}
      onSettings={() => console.log("UserMenu: settings")}
      onLogout={() => console.log("UserMenu: logout")}
      onApiKeys={() => console.log("UserMenu: API keys")}
      providerGroups={{
        language: ["OpenAI", "Anthropic", "Google"],
        image: ["OpenAI", "Google"],
        speech: ["Google"],
        transcription: ["OpenAI", "Google"],
        reranking: ["Anthropic"],
      }}
      enabledProvidersByType={{
        language: ["OpenAI"],
        image: ["Google"],
      }}
      disabledProviders={["Anthropic"]}
      onToggleProviderForType={(capability, provider) => console.log("UserMenu: toggle", capability, provider)}
      labels={{
        customize: "Customize",
        settings: "Settings",
        logout: "Logout",
        apiKeys: "API Keys",
        providers: "Providers",
        language: "Language",
        image: "Image",
        speech: "Speech",
        transcription: "Transcription",
        reranking: "Reranking",
        theme: "Theme",
      }}
    />
  );
};

const meta = {
  title: "UserMenu",
  component: UserMenuStory,
  argTypes: {
    email: { control: { type: "text" } },
    showApiKeysItem: { control: { type: "boolean" } },
    providersDisabled: { control: { type: "boolean" } },
  },
  args: {
    email: "user@example.com",
    showApiKeysItem: true,
    providersDisabled: false,
  },
} satisfies Meta<typeof UserMenuStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ProvidersDisabled: Story = {
  args: {
    providersDisabled: true,
  },
};

