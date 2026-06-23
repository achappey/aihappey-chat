import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme, NavigationItem } from "aihappey-types";

type NavigationStoryArgs = {
  drawerType?: "inline" | "overlay";
  isOpen?: boolean;
  multiple?: boolean;
  appTitle?: string;
};

const defaultItems: NavigationItem[] = [
  { key: "dashboard", label: "Dashboard", icon: "chart" },
  { key: "chat", label: "Chat", icon: "chat" },
  { key: "library", label: "Library", icon: "library" },
  { key: "settings", label: "Settings", icon: "settings" },
];

const NavigationStory = (args: NavigationStoryArgs) => {
  const { Navigation } = useTheme() as unknown as Pick<AihUiTheme, "Navigation">;
  const [activeKey, setActiveKey] = useState("dashboard");
  const [isOpen, setIsOpen] = useState(args.isOpen ?? true);

  return (
    <div style={{ minHeight: 360, position: "relative", border: "1px solid rgba(128,128,128,.35)", overflow: "hidden" }}>
      <Navigation
        {...args}
        activeKey={activeKey}
        onSelect={(key) => {
          setActiveKey(key);
          if (args.drawerType === "overlay") setIsOpen(false);
        }}
        items={defaultItems}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        style={args.drawerType === "overlay" ? { position: "absolute", inset: 0 } : undefined}
      />
    </div>
  );
};

const meta = {
  title: "Navigation",
  component: NavigationStory,
  argTypes: {
    drawerType: { control: { type: "select" }, options: ["inline", "overlay"] },
    isOpen: { control: { type: "boolean" } },
    multiple: { control: { type: "boolean" } },
    appTitle: { control: { type: "text" } },
  },
  args: {
    drawerType: "inline",
    isOpen: true,
    multiple: false,
    appTitle: "AIHappey",
  },
} satisfies Meta<typeof NavigationStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Overlay: Story = {
  args: {
    drawerType: "overlay",
  },
};

export const ConversationManagement: Story = {
  render: () => {
    const { Navigation } = useTheme() as unknown as Pick<AihUiTheme, "Navigation">;
    const [items, setItems] = useState<NavigationItem[]>([
      { key: "1", label: "Project Alpha Discussion", conversationItem: true, icon: "chat", pinned: true },
      { key: "2", label: "Code Review", conversationItem: true, icon: "chat" },
      { key: "settings", label: "Settings", icon: "settings" },
    ]);
    const [activeKey, setActiveKey] = useState("1");
    const [storageType, setStorageType] = useState<"local" | "remote">("local");

    return (
      <Navigation
        activeKey={activeKey}
        onSelect={setActiveKey}
        items={items}
        isOpen
        drawerType="inline"
        storageType={storageType}
        onStorageSwitch={setStorageType}
        onNewChat={() => {
          const key = Date.now().toString();
          setItems((prev) => [{ key, label: "New Chat", conversationItem: true, icon: "chat" }, ...prev]);
          setActiveKey(key);
        }}
        onRename={async (id, newName) => setItems((prev) => prev.map((item) => (item.key === id ? { ...item, label: newName } : item)))}
        onDelete={async (id) => setItems((prev) => prev.filter((item) => item.key !== id))}
        onTogglePin={async (id) => setItems((prev) => prev.map((item) => (item.key === id ? { ...item, pinned: !item.pinned } : item)))}
      />
    );
  },
};

