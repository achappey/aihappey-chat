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
    labels: {
        customize: "Customize",
        settings: "Settings",
        logout: "Logout",
        theme: "Theme"
    }
  })
};
