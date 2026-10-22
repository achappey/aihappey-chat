import { useTheme } from "aihappey-components";
import { useNavigate } from "react-router";
import { useAppStore } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";
import type { MenuItemProps } from "aihappey-types";

const MinimalNavBar = ({
  onSearch,
}: {
  onSearch: () => void;
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const selectConversation = useAppStore((s) => s.selectConversation);
  const { Button, Menu } = useTheme();
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const hiddenNavigationItemKeys = useAppStore((s) => s.hiddenNavigationItemKeys);

  const handleNewChat = () => {
    selectConversation(null);
    navigate("/");
  };

  // Keep the first category's order, labels, routes, and icons aligned with ConversationSidebar.
  const items: MenuItemProps[] = [
    { key: "new", label: t("newChat"), icon: "add", onClick: handleNewChat },
    { key: "realtime", label: t("realtime"), icon: "realtime", onClick: () => navigate("/realtime") },
    { key: "search-conversations", label: t("conversationSearch"), icon: "search", onClick: onSearch },
    { key: "hub-search", label: t("hubSearch.title"), icon: "embedding", onClick: () => navigate("/hub-search") },
    { key: "images", label: t("images"), icon: "images", onClick: () => navigate("/images") },
    { key: "transcriptions", label: t("transcriptions"), icon: "transcription", onClick: () => navigate("/transcriptions") },
    { key: "speech", label: t("speech"), icon: "speech", onClick: () => navigate("/speech") },
    { key: "decisions", label: t("decisions"), icon: "decision", onClick: () => navigate("/decisions") },
    { key: "reranking", label: t("reranking"), icon: "reranking", onClick: () => navigate("/reranking") },
    { key: "videos", label: t("videos"), icon: "videos", onClick: () => navigate("/videos") },
    { key: "jobs", label: t("jobs", "Jobs"), icon: "jobs", onClick: () => navigate("/jobs") },
    { key: "arena", label: t("arena"), icon: "arena", onClick: () => navigate("/arena") },
  ];
  const hiddenKeys = new Set(hiddenNavigationItemKeys ?? []);
  const visibleItems = items.filter((item) => !hiddenKeys.has(item.key));
  const hiddenItems = items.filter((item) => hiddenKeys.has(item.key));

  return (
    <nav
      style={{
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingLeft: 14,
        paddingTop: 10,
        zIndex: 2,
      }}
      aria-label="Minimal navigation"
    >
      <Button
        icon="navigationMenu"
        size="small"
        variant="transparent"
        aria-label={t("openNavigation")}
        title={t("openNavigation")}
        onClick={toggleSidebar}
        style={{ marginBottom: 8 }}
      />
      {visibleItems.map((item) => (
        <Button
          key={item.key}
          icon={item.icon}
          size="small"
          variant="transparent"
          aria-label={item.label}
          title={item.label}
          onClick={item.onClick}
          style={{ marginBottom: 8 }}
        />
      ))}
      {hiddenItems.length > 0 && (
        <Menu
          items={hiddenItems}
          align="left"
          trigger={
            <Button
              icon="moreHorizontal"
              size="small"
              variant="transparent"
              aria-label={t("more")}
              title={t("more")}
              style={{ marginBottom: 8 }}
            />
          }
        />
      )}
    </nav>
  );
};

export { MinimalNavBar };
