import { useTheme } from "aihappey-components";

import { useTranslation } from "aihappey-i18n";
import { useAppStore } from "aihappey-state";
import { useDarkMode } from "usehooks-ts";

interface ServersHeaderProps {
  onAddServer: () => void;
}

export const ServersHeader = ({ onAddServer }: ServersHeaderProps) => {
  const { Button } = useTheme();
  const { t } = useTranslation();
  const { isDarkMode } = useDarkMode();

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        height: 48,
        display: "flex",
        backgroundColor: isDarkMode ? "#292929" : "#ffffff",
        alignItems: "center",
        padding: "0 12px",
        borderBottom: "1px solid #222",
        marginBottom: 24,
      }}
    >
      <div style={{ flex: 1 }} />
      <Button type="button" variant="primary" icon="add" onClick={onAddServer}>
        {t("manageServersModal.add")}
      </Button>
    </div>
  );
};
