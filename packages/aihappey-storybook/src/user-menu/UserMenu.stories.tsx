import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { UserMenu } from "aihappey-components";

const meta: Meta<typeof UserMenu> = {
  title: "components/UserMenu",
  component: UserMenu,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof UserMenu>;

export const Default: Story = {
  args: {
    onSettings: () => console.log("settings"),
    onLogout: () => console.log("logout"),
  },
};

export const WithEmail: Story = {
  args: {
    email: "user@example.com",
    onSettings: () => console.log("settings"),
    onLogout: () => console.log("logout"),
  },
};

export const WithCustomize: Story = {
  args: {
    email: "user@example.com",
    onCustomize: () => console.log("customize"),
    onSettings: () => console.log("settings"),
    onLogout: () => console.log("logout"),
    labels: {
      customize: "Customize",
      settings: "Settings",
      logout: "Log out",
    },
  },
};

export const LongEmail: Story = {
  args: {
    email: "very.long.email.address.with.many.parts+tag@really-long-domain.example.com",
    onCustomize: () => console.log("customize"),
    onSettings: () => console.log("settings"),
    onLogout: () => console.log("logout"),
  },
};

