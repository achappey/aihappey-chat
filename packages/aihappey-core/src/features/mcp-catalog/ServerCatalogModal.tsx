import { useState, useMemo, useEffect, useCallback } from "react";
import { useAppStore } from "aihappey-state";
import {
  AuthorBadges,
  RegistryServerCard,
  ServerCatalogSearchContentList,
  useTheme,
  type ServerCatalogTabKey,
} from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useRecentlyUsed } from "./useRecentlyUsed";
import { useAccount } from "aihappey-auth";
import { McpRegistryServerResponse } from "aihappey-types";
import { useDefaultRegistries } from "../../shell/connectors/useDefaultRegistries";
import { useChatContext } from "../chat/context/ChatContext";

type Props = {
  show: boolean;
  onHide: () => void;
  addMcpServer: (item: McpRegistryServerResponse) => void;
  removeMcpServer: (item: McpRegistryServerResponse) => void;
  installedServerKeys: string[];
};

function getBaseDomain(hostname: string): string {
  const parts = hostname.split(".");
  if (parts.length >= 2) return parts.slice(-2).join(".");
  return hostname;
}

export const ServerCatalogModal = ({
  show,
  onHide,
  installedServerKeys,
  removeMcpServer,
  addMcpServer,
}: Props) => {
  const { t } = useTranslation();
  const account = useAccount();
  const getRegistries = useDefaultRegistries();
  const mcpRegistries = useAppStore((s) => s.mcpRegistries);
  const quickSearches = useAppStore((s) => s.quickSearches);
  const chat = useChatContext();

  const [showBaseDomain, setShowBaseDomain] = useState(!!chat.config.getAccessToken);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<ServerCatalogTabKey>("all");

  const recently = useRecentlyUsed();
  const recentlySet = useMemo(() => new Set(recently), [recently]);

  const servers = useMemo(
    () => Object.keys(mcpRegistries).flatMap((k) => mcpRegistries[k]),
    [mcpRegistries]
  );

  useEffect(() => {
    if (show && Object.keys(mcpRegistries).length == 0) getRegistries();
  }, [show, getRegistries]);

  const handleClose = useCallback(() => {
    setSearch("");
    setActiveTab("all");
    onHide();
  }, [onHide]);
  const { Modal, Button } = useTheme();
  const baseDomain = useMemo(() => getBaseDomain(window.location.hostname), []);

  return (
    <Modal
      show={show}
      onHide={handleClose}
      actions={
        <Button onClick={handleClose}
          variant="secondary"
          type="button">
          {t("close")}
        </Button>
      }
      title={t("catalogModal.catalog")}
    >
      <ServerCatalogSearchContentList
        servers={servers}
        installedServerKeys={installedServerKeys}
        recentlyUsedUrls={recentlySet}
        ownerEmail={account?.username?.toLowerCase()}
        search={search}
        onSearchChange={setSearch}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        quickSearches={quickSearches}
        enableBaseDomainToggle={!!chat.config.getAccessToken}
        baseDomain={baseDomain}
        showBaseDomain={showBaseDomain}
        onToggleBaseDomain={() => setShowBaseDomain((v) => !v)}
        renderItem={({ server, exists, ownerNames }: any) => (
          <RegistryServerCard
            serverItem={server}
            renderDescription={() => <AuthorBadges authors={ownerNames} />}
            onRemove={exists ? () => removeMcpServer(server) : undefined}
            onInstall={!exists ? () => addMcpServer(server) : undefined}
          />
        )}
      />
    </Modal>
  );
};


