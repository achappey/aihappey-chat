import { useCallback } from "react";
import { useTheme } from "aihappey-components";
import { useAppStore } from "aihappey-state";
import type { NavigationItem } from "aihappey-types/src/theme";
import { useConversations } from "aihappey-conversations";
import { useNavigate, useLocation, useParams } from "react-router";
import { useTranslation } from "aihappey-i18n";
import { useDrop } from "react-dnd";
import { NativeTypes } from "react-dnd-html5-backend";
import { useIsDesktop } from "../responsive/useIsDesktop";

export const ConversationSidebar = ({
  onSearch,
}: {
  onSearch: () => void;
}) => {

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
  const togglePinnedConversation = useAppStore((a) => a.togglePinnedConversation);
  const pinnedConversations = useAppStore((a) => a.pinnedConversations);
  const isDesktop = useIsDesktop();
  // When breakpoint changes, reset sidebarOpen to match desktop/mobile
  const { conversationId } = useParams<{ conversationId?: string }>();

  // const [searchOpen, setSearchOpen] = useState(false);

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
      key: "realtime",
      label: t("realtime"),
      href: "/realtime",
      icon: "realtime",
    },
    {
      key: "search-conversations",
      label: t("conversationSearch"),
      icon: "search",
      onClick: onSearch,
    },
    {
      key: "images",
      label: t("images"),
      href: "/images",
      icon: "images",
    },
    {
      key: "transcriptions",
      label: t("transcriptions"),
      href: "/transcriptions",
      icon: "transcription",
    },
    {
      key: "speech",
      label: t("speech"),
      href: "/speech",
      icon: "speech",
    },

    {
      key: "reranking",
      label: t("reranking"),
      href: "/reranking",
      icon: "reranking",
    },
    {
      key: "videos",
      label: t("videos"),
      href: "/videos",
      icon: "videos",
    },
    {
      key: "arena",
      label: t("arena"),
      href: "/arena",
      icon: "arena",
    },
    { key: "divider", label: "" },
    {
      key: "agents",
      label: t("agents.title"),
      href: "/agents",
      icon: "robot",
    },
    {
      key: "apps",
      label: t("webApps"),
      href: "/apps",
      icon: "webApps",
    },
    {
      key: "files",
      label: t("files"),
      href: "/files",
      icon: "folder",
    },
    {
      key: "skills",
      label: t("skills"),
      href: "/skills",
      icon: "skills",
    },
    {
      key: "structured-outputs",
      label: t("structure"),
      href: "/structured-outputs",
      icon: "structuredOutputs",
    },
    {
      key: "tools",
      label: t("tools"),
      href: "/tools",
      icon: "tool",
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
        {
          key: "providers",
          label: t("providers"),
          href: "/providers",
          icon: "providers",
        },
        {
          key: "mesh",
          label: t("mesh"),
          href: "/mesh",
          icon: "chart",
        },
        {
          key: "usage",
          label: t("ai.usage.nav"),
          href: "/usage",
          icon: "databaseGear",
        },
        {
          key: "playground",
          label: "Playground",
          href: "/playground",
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
      label: t("componentsPage.title"),
      icon: "components",
      children: [
        {
          key: "catalogs",
          label: t("componentsPage.catalogs"),
          href: "/catalogs",
          icon: "server",
        },
        {
          key: "registries",
          label: t("componentsPage.registries"),
          href: "/registries",
          icon: "server",
        },
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

  const chatNavItems: NavigationItem[] = conversations.items
    .slice()
    .sort((a, b) => {
      const aPinned = pinnedConversations?.includes(a.id) ? 1 : 0;
      const bPinned = pinnedConversations?.includes(b.id) ? 1 : 0;

      // 1️⃣ pinned always on top
      if (aPinned !== bPinned) {
        return bPinned - aPinned;
      }

      // 2️⃣ within same group → sort by last message timestamp desc
      const ta = new Date(
        a.messages?.[a.messages.length - 1]?.metadata?.timestamp ?? 0
      ).getTime();

      const tb = new Date(
        b.messages?.[b.messages.length - 1]?.metadata?.timestamp ?? 0
      ).getTime();

      return tb - ta;
    })
    .map((conv) => ({
      key: conv.id,
      label: conv.metadata?.name ?? "New chat",
      conversationItem: true,
      pinned: pinnedConversations?.includes(conv.id),
    }));

  const navItems: NavigationItem[] = [...staticNavItems, ...chatNavItems];

  // Determine active key: highlight "servers" if on /servers, else selected chat
  const activeKey =
    location.pathname === "/model-context-catalog"
      ? "servers"
      : location.pathname === "/agents"
        ? "agents"
        : location.pathname === "/models"
          ? "models"
          : location.pathname === "/providers"
            ? "providers"
            : location.pathname === "/mesh"
              ? "mesh"
              : location.pathname === "/usage"
                ? "usage"
                : location.pathname === "/tools"
                  ? "tools"
                  : location.pathname === "/files"
                    ? "files"
                    : location.pathname === "/skills"
                      ? "skills"
                      : location.pathname === "/structured-outputs"
                        ? "structured-outputs"
                        : location.pathname === "/web-apps" || location.pathname.startsWith("/web-apps/")
                          ? "web-apps"
                          : location.pathname === "/catalogs"
                            ? "catalogs"
                            : location.pathname === "/registries"
                              ? "registries"
                              : location.pathname === "/reranking"
                                ? "reranking"
                                : location.pathname === "/realtime"
                                  ? "realtime"
                                  : conversationId ?? undefined

  // Handle navigation selection
  const handleSelect = async (id: string) => {
    if (id === "servers") {
      await navigate("/model-context-catalog");
    } else if (id === "agents") {
      await navigate("/agents");
    } else if (id === "apps") {
      await navigate("/apps");
    } else if (id === "models") {
      await navigate("/models");
    } else if (id === "providers") {
      await navigate("/providers");
    } else if (id === "mesh") {
      await navigate("/mesh");
    } else if (id === "usage") {
      await navigate("/usage");
    } else if (id === "tools") {
      await navigate("/tools");
    } else if (id === "files") {
      await navigate("/files");
    } else if (id === "skills") {
      await navigate("/skills");
    } else if (id === "structured-outputs") {
      await navigate("/structured-outputs");
    } else if (id === "web-apps") {
      await navigate("/web-apps");
    } else if (id === "catalogs") {
      await navigate("/catalogs");
    } else if (id === "registries") {
      await navigate("/registries");
    } else if (id === "reranking") {
      await navigate("/reranking");
    } else if (id === "realtime") {
      await navigate("/realtime");
    } else if (id === "images") {
      await navigate("/images");
    } else if (id === "transcriptions") {
      await navigate("/transcriptions");
    } else if (id === "speech") {
      await navigate("/speech");
    } else if (id === "videos") {
      await navigate("/videos");
    } else if (id === "arena") {
      await navigate("/arena");
    } else if (id === "new") {
      await handleCreate();
    } else {
      await navigate(`/${id}`);

      var conv = conversations.items.find(a => a.id == id);
      if (conv?.metadata?.name) {
        document.title = conv?.metadata?.name;
      }
    }
  };

  // DnD preview
  const [{ isOver }, drop] = useDrop({
    accept: [NativeTypes.FILE],
    canDrop: (item: { files: File[] }) =>
      item.files?.every(f => f.name.endsWith(".json")),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });


  const dropRef = useCallback((node: HTMLDivElement | null) => {
    if (node) drop(node);
  }, [drop]);


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
    new: t('new'),
    pin: t('pinChat'),
    unpin: t('unpinChat'),
    closeNavigation: t('closeNavigation'),
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
        onTogglePin={async (a) => {
          togglePinnedConversation(a);
        }}
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
