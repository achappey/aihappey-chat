import { useState } from "react";
import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { ServerManagementModal } from "./ServerManagementModal";
import { useAppStore } from "aihappey-state";

export const ServerSelectButton = () => {
  const { Button } = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const updateMcpServers = useAppStore((s) => s.updateMcpServers);
  const mcpServers = useAppStore((s) => s.mcpServers);
  const onHide = (enabledServers: Set<string>) => {
    setOpen(false)
    var updates: any = {

    }

    var keys = Object.keys(mcpServers);
    for (const name of keys) {
      updates[name] = {
        ...mcpServers[name].config,
        disabled: !enabledServers.has(name)
      };
    }

    updateMcpServers(updates);
  }

  return (
    <>
      <Button
        type="button"
        icon="mcpServer"
        size="large"
        variant="transparent"
        onClick={() => setOpen(true)}
        title={t("mcpPage.title")}
      ></Button>

      <ServerManagementModal show={open} onHide={onHide} />
    </>
  );
};
