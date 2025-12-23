import React, { useState } from "react";
import { useTheme } from "aihappey-components";

const NavigationView = (props) => {
  const { Navigation } = useTheme();
  return React.createElement(Navigation, props);
};

export default {
  title: "Navigation",
  component: NavigationView,
};

export const Default = {
  render: () => {
    const [activeKey, setActiveKey] = useState("home");
    return React.createElement(NavigationView, {
        activeKey: activeKey,
        onSelect: setActiveKey,
        items: [
            { key: "home", label: "Home" },
            { key: "settings", label: "Settings" }
        ],
        isOpen: true,
        drawerType: "inline"
    });
  }
};

export const WithIcons = {
  render: () => {
    const [activeKey, setActiveKey] = useState("dashboard");
    return React.createElement(NavigationView, {
        activeKey: activeKey,
        onSelect: setActiveKey,
        items: [
            { key: "dashboard", label: "Dashboard", icon: "chart" },
            { key: "chat", label: "Chat", icon: "chat" },
            { key: "library", label: "Library", icon: "library" },
            { key: "settings", label: "Settings", icon: "settings" }
        ],
        isOpen: true,
        drawerType: "inline"
    });
  }
};

export const Overlay = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeKey, setActiveKey] = useState("home");
    
    return React.createElement("div", { style: { height: "400px", position: "relative", border: "1px solid #ccc", overflow: "hidden" } },
      React.createElement("button", { onClick: () => setIsOpen(true), style: { margin: "20px" } }, "Open Navigation"),
      React.createElement(NavigationView, {
          activeKey: activeKey,
          onSelect: (k) => { setActiveKey(k); setIsOpen(false); },
          items: [
              { key: "home", label: "Home", icon: "add" },
              { key: "profile", label: "Profile", icon: "personalization" }
          ],
          isOpen: isOpen,
          onClose: () => setIsOpen(false),
          drawerType: "overlay",
          style: { position: "absolute", top: 0, left: 0, height: "100%" }
      })
    );
  }
};

export const ConversationManagement = {
  render: () => {
    const [items, setItems] = useState([
      { key: "1", label: "Project Alpha Discussion", conversationItem: true, icon: "chat" },
      { key: "2", label: "Code Review", conversationItem: true, icon: "chat" },
      { key: "settings", label: "Settings", icon: "settings" }
    ]);
    const [activeKey, setActiveKey] = useState("1");
    const [storageType, setStorageType] = useState("local");

    const handleRename = async (id, newName) => {
      console.log("Renaming", id, "to", newName);
      setItems(prev => prev.map(item => item.key === id ? { ...item, label: newName } : item));
    };

    const handleDelete = async (id) => {
      console.log("Deleting", id);
      setItems(prev => prev.filter(item => item.key !== id));
      if (activeKey === id) setActiveKey(items[0]?.key || "");
    };

    const handleNewChat = () => {
      const newId = Date.now().toString();
      const newItem = { key: newId, label: "New Chat", conversationItem: true, icon: "chat" };
      setItems(prev => [newItem, ...prev]);
      setActiveKey(newId);
    };

    return React.createElement(NavigationView, {
        activeKey: activeKey,
        onSelect: setActiveKey,
        items: items,
        isOpen: true,
        drawerType: "inline",
        storageType: storageType,
        onStorageSwitch: setStorageType,
        onNewChat: handleNewChat,
        onRename: handleRename,
        onDelete: handleDelete
    });
  }
};
