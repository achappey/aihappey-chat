import { useState } from "react";
import { useAccount } from "aihappey-auth";
import { UserMenuButton } from "./UserMenuButton";
import SettingsModal from "./SettingsModal";

/**
 * Inline user menu + settings modal host.
 *
 * Intended for use in page-level top rows (e.g. Images / Speech / Transcriptions)
 * where we want the same behavior as the Chat header menu.
 */
export const UserMenuInline: React.FC = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const account = useAccount();

  return (
    <>
      <UserMenuButton
        email={account?.username}
        onSettings={() => setSettingsOpen(true)}
        onLogout={() => console.log("Logout clicked")}
      />

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
};

