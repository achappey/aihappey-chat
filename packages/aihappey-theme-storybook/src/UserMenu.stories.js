import React from "react";
import { useTheme } from "aihappey-components";

const UserMenuView = (props) => {
  const { UserMenu } = useTheme();
  return React.createElement(UserMenu, props);
};

export default {
  title: "UserMenu",
  component: UserMenuView,
};

export const Default = {
  render: () => React.createElement(UserMenuView, {
    email: "user@example.com",
    onCustomize: () => alert("Customize"),
    onSettings: () => alert("Settings"),
    onLogout: () => alert("Logout"),
    providers: ["OpenAI", "Anthropic", "Google"],
    providerGroups: {
      language: ["OpenAI", "Anthropic", "Google"],
      image: ["OpenAI", "Google"],
      speech: ["Google"],
      transcription: ["OpenAI", "Google"],
      reranking: ["Anthropic"],
    },
    enabledProviders: ["OpenAI"],
    onToggleProvider: (p) => alert(`Toggle provider: ${p}`),
    labels: {
        customize: "Customize",
        settings: "Settings",
        logout: "Logout",
        providers: "Providers",
        language: "Language",
        image: "Image",
        speech: "Speech",
        transcription: "Transcription",
        reranking: "Reranking",
        theme: "Theme"
    }
  })
};
