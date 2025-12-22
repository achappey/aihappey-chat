import { useTheme } from "aihappey-components";
import { useNavigate } from "react-router";
import { useAppStore } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";

const MinimalNavBar = (): JSX.Element => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const selectConversation = useAppStore((s) => s.selectConversation);
  const { Button } = useTheme();
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);

  const handleNewChat = () => {
    selectConversation(null);
    navigate("/");
  };

  const handleLibrary = () => {
    navigate("/library");
  };

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
        icon="menu"
        size="small"
        variant="transparent"
        aria-label={t("toggleSidebar")}
        onClick={toggleSidebar}
        style={{ marginBottom: 8 }}
      />
      <Button
        icon="add"
        size="small"
        variant="transparent"
        aria-label={t("chat.newChat")}
        onClick={handleNewChat}
        style={{ marginBottom: 8 }}
      />
      <Button
        icon="library"
        size="small"
        variant="transparent"
        aria-label={t("library.title")}
        onClick={handleLibrary}
      />
    </nav>
  );
};

export { MinimalNavBar };
