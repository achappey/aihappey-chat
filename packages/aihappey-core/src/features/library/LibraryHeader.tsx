import { useState } from "react";
import { useTheme } from "aihappey-components";
import { UserMenuButton } from "../../features/user-settings/UserMenuButton";
import { useAccount } from "aihappey-auth";
import SettingsModal from "../../features/user-settings/SettingsModal";
import { useTranslation } from "aihappey-i18n";
import { useNavigate } from "react-router";

interface LibraryHeaderProps {}

export const LibraryHeader: React.FC<LibraryHeaderProps> = ({}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { Breadcrumb } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const account = useAccount();
  const email = account?.username;

  return (
    <>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          height: 48,
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          gap: 16,
        }}
      >
        <Breadcrumb
          size="large"
          items={[
            {
              key: "library",
              icon: "library",
              onClick: () => navigate("/library"),
              label: t("library.title"),
            },
          ]}
        />

        <div style={{ flex: 1 }} />
        <UserMenuButton
          email={email}
          onSettings={() => setSettingsOpen(true)}
          onLogout={() => console.log("Logout clicked")}
        />
      </div>
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
};
