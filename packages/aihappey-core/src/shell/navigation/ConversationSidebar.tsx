import { useCallback, useMemo, useState } from "react";
import { useTheme } from "aihappey-components";
import { useAppStore } from "aihappey-state";
import type { NavigationItem } from "aihappey-types/src/theme";
import { useConversations } from "aihappey-conversations";
import { useNavigate, useLocation, useParams } from "react-router";
import { useTranslation } from "aihappey-i18n";
import { useDrop } from "react-dnd";
import { NativeTypes } from "react-dnd-html5-backend";
import { useIsDesktop } from "../responsive/useIsDesktop";

export const ConversationSidebar = () => {
  const selectConversation = useAppStore((s) => s.selectConversation);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const conversations = useConversations();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { Navigation } = useTheme();
  const conversationStorage = useAppStore((a) => a.conversationStorage);
  const remoteStorageConnected = useAppStore((a) => a.remoteStorageConnected);
  const setConversationStorage = useAppStore((a) => a.setConversationStorage);
  const isDesktop = useIsDesktop();
  // When breakpoint changes, reset sidebarOpen to match desktop/mobile
  const { conversationId } = useParams<{ conversationId?: string }>();

  const handleCreate = async () => {
    // Reset current selection *before* navigating so ChatPage starts blank
    selectConversation(null);
    await navigate("/");
  };

  const handleRemove = async (id: string) => {
    await conversations.remove(id);
    conversations.refresh();

    if (conversationId == id) {
      await navigate("/");
    }
  };

  // Build navigation items: servers section, servers link, divider, then chats
  const staticNavItems: NavigationItem[] = [
    {
      key: "new",
      label: t("newChat"),
      href: "/",
      icon: "add",
      onClick: handleCreate,
    },
    {
      key: "library",
      label: t("library.title"),
      href: "/library",
      icon: "library",
    },
    {
      key: "arena",
      label: t("arena"),
      href: "/arena",
      icon: "arena",
    },
    { key: "divider", label: "" },
    {
      key: "category",
      label: t("ai.title"),
      icon: "brain",
      children: [
        {
          key: "models",
          label: t("models"),
          href: "/models",
          icon: "brain",
        },
      ],
    },
    {
      key: "category",
      label: t("mcpPage.title"),
      icon: "mcpServer",
      children: [
        {
          key: "servers",
          label: t("manageServersModal.catalog"),
          href: "/model-context-catalog",
          icon: "server",
        },
      ],
    },
    {
      key: "category",
      label: t("agents.framework"),
      icon: "robot",
      children: [
        {
          key: "agents",
          label: t("agents.title"),
          href: "/agents",
        }
      ],
    },
  ];

  if (conversations.items.length > 0) {
    staticNavItems.push({ key: "divider", label: "" });
    staticNavItems.push({ key: "section:chats", label: t("chats") });
  }

  const handleExport = async (id: string) => {
    const conv = conversations.items.find((c) => c.id === id);
    if (!conv) return;

    // Full object (metadata + messages + anything else)
    const json = JSON.stringify(conv, null, 2);

    // Create blob
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // Create download link
    const a = document.createElement("a");
    a.href = url;

    // Filename from conversation name
    const safeName = (conv.metadata?.name ?? "conversation")
      .replace(/[^a-z0-9\-]+/gi, "_")
      .toLowerCase();

    a.download = `Conversation_${conv.id}_${safeName}.json`;
    a.click();

    URL.revokeObjectURL(url);
  };


  const chatNavItems: NavigationItem[] = conversations.items.map(
    (conv: any) => ({
      key: conv.id,
      label: conv.metadata?.name ?? "New chat",
      conversationItem: true,
    })
  );

  const navItems: NavigationItem[] = [...staticNavItems, ...chatNavItems];

  // Determine active key: highlight "servers" if on /servers, else selected chat
  const activeKey =
    location.pathname === "/model-context-catalog"
      ? "servers"
      : location.pathname === "/agents"
        ? "agents"
        : location.pathname === "/models"
          ? "models"
          : conversationId ?? undefined

  // Handle navigation selection
  const handleSelect = async (id: string) => {
    if (id === "servers") {
      await navigate("/model-context-catalog");
    } else if (id === "agents") {
      await navigate("/agents");
    } else if (id === "models") {
      await navigate("/models");
    } else {
      await navigate(`/${id}`);

      var conv = conversations.items.find(a => a.id == id);
      if (conv?.metadata?.name) {
        document.title = conv?.metadata?.name;
      }
    }
  };

  // DnD preview
  const [{ isOver }, dropRef] = useDrop({
    accept: [NativeTypes.FILE],
    canDrop: (item: { files: File[] }) =>
      item.files?.every(f => f.name.endsWith(".json")),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const handleFileDrop = async (item: any) => {
    const files: FileList | undefined = item?.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const importedIds: string[] = [];

    for (const file of Array.from(files)) {
      if (!file.name.toLowerCase().endsWith(".json")) {
        console.warn("Skipping non-chat file:", file.name);
        continue;
      }

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data?.id && data?.messages && data?.messages?.length > 0) {
          var current = conversations.items.find(a => a.id == data.id)

          if (!current) {
            const newId = await conversations.import(data);
            importedIds.push(newId);
          }
        }
      } catch (err) {
        console.error("Failed to import conversation", file.name, err);
      }
    }

    if (importedIds.length === 0) return;

    // Refresh only once for performance
    conversations.refresh();

    // Navigate to the last imported conversation
    const lastId = importedIds[importedIds.length - 1];
    selectConversation(lastId);
    await navigate(`/${lastId}`);
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const translations = {
    export: t('export'),
    delete: t('delete'),
    rename: t('rename')
  }
  return (
    <div ref={dropRef}
      onDrop={handleFileDrop}
      style={{
        height: "100%",
        border: isOver ? "2px dotted" : undefined,
        borderColor: isOver ? "#888" : "transparent",
      }}
      onDragOver={handleDragOver}>
      <Navigation
        items={navItems}
        translations={translations}
        onClose={() => setSidebarOpen(false)}
        isOpen={sidebarOpen}
        onDelete={handleRemove}
        onRename={conversations.rename}
        onStorageSwitch={
          remoteStorageConnected
            ? (config) => setConversationStorage(config)
            : undefined
        }
        storageType={conversationStorage}
        activeKey={activeKey}
        onSelect={handleSelect}
        onExport={handleExport}
        drawerType={isDesktop ? "inline" : "overlay"}
        style={{ flex: 1, overflowY: "auto", maxHeight: "100%" }}
      />
    </div>
  );
};
