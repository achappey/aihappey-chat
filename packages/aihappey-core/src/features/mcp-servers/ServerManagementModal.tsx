import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "aihappey-state";
import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { CancelButton } from "../../ui/buttons/CancelButton";
import { AddServerModal } from "./AddServerModal";
import { ServerCatalogModal } from "../mcp-catalog/ServerCatalogModal";
import { McpRegistryServerResponse } from "aihappey-types";
import { ServerManagement } from "aihappey-components";

type Props = {
  show: boolean;
  onHide: (enabled: Set<string>) => void;
};

const keyOf = (name: string) => name.trim().toLowerCase();

export const ServerManagementModal = ({ show, onHide }: Props) => {
  const { Modal, Button } = useTheme();
  const { t } = useTranslation();

  const mcpServers = useAppStore((s) => s.mcpServers);
  const removeMcpServer = useAppStore((s) => s.removeMcpServer);
  const addMcpServer = useAppStore((s) => s.addMcpServer);

  const serverUrls = Object.keys(mcpServers);

  const onInstall = useCallback(
    (item: McpRegistryServerResponse) => {
      const key = keyOf(item.server.name);
      if (mcpServers[key]) return;

      addMcpServer(key, {
        config: {
          type: "http",
          url:
            item.server.remotes?.find((a) => a.type === "streamable-http")?.url!,
          disabled: true,
        },
        registry: item,
      });
    },
    [addMcpServer, mcpServers]
  );

  const onUninstall = useCallback(
    (item: McpRegistryServerResponse) => {
      const key = keyOf(item.server.name);
      if (!mcpServers[key]) return;
      removeMcpServer(key);
    },
    [removeMcpServer, mcpServers]
  );

  const servers = useMemo(() => {
    return Object.entries(mcpServers).map(([key, server]) => ({
      key, // store key (lower-case)
      displayName: server.registry?.server?.name ?? key,
      server,
    }));
  }, [mcpServers]);

  const initiallyEnabled = useMemo(() => {
    return servers
      .filter((s) => !s.server.config.disabled)
      .map((s) => s.key);
  }, [servers]);

  const [enabled, setEnabled] = useState<Set<string>>(() => new Set());
  const knownKeysRef = useRef<Set<string>>(new Set());

  // Seed when modal opens (snapshot -> draft)
  useEffect(() => {
    if (!show) return;
    setEnabled(new Set(initiallyEnabled));
    knownKeysRef.current = new Set(servers.map((s) => s.key));
  }, [show, initiallyEnabled, servers]);

  // Reconcile while open: keep user toggles, only handle add/remove
  useEffect(() => {
    if (!show) return;

    const currentKeys = new Set(servers.map((s) => s.key));

    setEnabled((prev) => {
      const next = new Set<string>();

      // keep user choices that still exist
      for (const k of prev) if (currentKeys.has(k)) next.add(k);

      // auto-add truly new servers (only ones that appeared since last time)
      for (const s of servers) {
        if (!knownKeysRef.current.has(s.key) && !s.server.config.disabled) {
          next.add(s.key);
        }
      }

      return next;
    });

    knownKeysRef.current = currentKeys;
  }, [show, servers]);

  const [showAdd, setShowAdd] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);

  const toggle = useCallback((key: string) => {
    const k = keyOf(key);
    setEnabled((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  }, []);

  const handleOk = () => onHide(enabled);
  const handleCancel = () => onHide(new Set(initiallyEnabled));

  return (
    <>
      <Modal
        show={show && !showCatalog}
        onHide={handleCancel}
        title={t("serverSelectModal.title", {
          enabled: enabled.size,
          total: servers.length,
        })}
        actions={
          <>
            <Button
              variant="subtle"
              icon="add"
              onClick={() => setShowAdd(true)}
            />
            <Button
              variant="subtle"
              icon="catalog"
              onClick={() => setShowCatalog(true)}
            >
              {t("manageServersModal.catalog")}
            </Button>
            <CancelButton onClick={handleCancel} />
            <Button onClick={handleOk}>{t("ok")}</Button>
          </>
        }
      >
        <ServerManagement
          enabled={enabled}
          onToggle={toggle}
          mcpServers={mcpServers}
          onRemove={(name: any) => removeMcpServer(keyOf(name))}
        />
      </Modal>

      <ServerCatalogModal
        show={showCatalog}
        installedServerKeys={serverUrls}
        removeMcpServer={onUninstall}
        addMcpServer={onInstall}
        onHide={() => setShowCatalog(false)}
      />

      <AddServerModal show={showAdd} onHide={() => setShowAdd(false)} />
    </>
  );
};
