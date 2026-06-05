import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";

const UserMenuStory = () => {
  const { UserMenu } = useTheme();

  return (
    <div style={{ display: "flex", justifyContent: "flex-end", padding: 24 }}>
      <UserMenu
        email="arthur@example.com"
        onSettings={() => console.log("Settings")}
        onLogout={() => console.log("Log out")}
        showApiKeysItem
        onApiKeys={() => console.log("API keys")}
        providers={["OpenAI", "Anthropic", "Pollinations"]}
        providerGroups={{
          language: ["OpenAI", "Anthropic", "Pollinations"],
          image: ["Pollinations"],
        }}
        enabledProvidersByType={{
          language: ["OpenAI", "Pollinations"],
          image: ["Pollinations"],
        }}
        onToggleProviderForType={(capability, provider) => console.log("Toggle provider", capability, provider)}
      />
    </div>
  );
};

const meta = {
  title: "Buttons/UserMenu",
  component: UserMenuStory,
} satisfies Meta<typeof UserMenuStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

