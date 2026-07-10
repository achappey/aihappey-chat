import { useTheme } from "aihappey-components";
import { useNavigate } from "react-router";
import { useAppStore } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";

const MinimalNavBar = ({
  onSearch,
}: {
  onSearch: () => void;
}) => {
  //const MinimalNavBar = (): JSX.Element => {
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
    navigate("/images");
  };

  const handleReranking = () => {
    navigate("/reranking");
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
        icon="navigationMenu"
        size="small"
        variant="transparent"
        aria-label={t("openNavigation")}
        title={t("openNavigation")}
        onClick={toggleSidebar}
        style={{ marginBottom: 8 }}
      />
      <Button
        icon="add"
        size="small"
        variant="transparent"
        aria-label={t("newChat")}
        title={t("newChat")}
        onClick={handleNewChat}
        style={{ marginBottom: 8 }}
      />
      <Button
        icon="realtime"
        size="small"
        variant="transparent"
        title={t("realtime")}
        aria-label={t("realtime")}
        style={{ marginBottom: 8 }}
        onClick={() =>
          navigate("/realtime")
        }
      />

      <Button
        icon="search"
        size="small"
        variant="transparent"
        aria-label={t("conversationSearch")}
        title={t("conversationSearch")}
        onClick={onSearch}
        style={{ marginBottom: 8 }}
      />
      <Button
        icon="images"
        size="small"
        variant="transparent"
        title={t("images")}
        aria-label={t("images")}
        style={{ marginBottom: 8 }}
        onClick={handleLibrary}
      />
      <Button
        icon="transcription"
        size="small"
        variant="transparent"
        title={t("transcriptions")}
        style={{ marginBottom: 8 }}
        aria-label={t("transcriptions")}
        onClick={() =>
          navigate("/transcriptions")
        }
      />
      <Button
        icon="speech"
        size="small"
        variant="transparent"
        title={t("speech")}
        aria-label={t("speech")}
        style={{ marginBottom: 8 }}
        onClick={() =>
          navigate("/speech")
        }
      />
      <Button
        icon="jobs"
        size="small"
        variant="transparent"
        title={t("jobs", "Jobs")}
        aria-label={t("jobs", "Jobs")}
        style={{ marginBottom: 8 }}
        onClick={() =>
          navigate("/jobs")
        }
      />


      <Button
        icon="reranking"
        size="small"
        variant="transparent"
        title={t("reranking")}
        aria-label={t("reranking")}
        style={{ marginBottom: 8 }}
        onClick={handleReranking}
      />

      <Button
        icon="video"
        size="small"
        variant="transparent"
        title={t("videos")}
        aria-label={t("videos")}
        style={{ marginBottom: 8 }}
        onClick={() =>
          navigate("/videos")
        }
      />
    </nav>
  );
};

export { MinimalNavBar };
