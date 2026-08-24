import { useEffect, useState } from "react";
import { DocumentSourceCard, useTheme } from "aihappey-components";
import {
  getVectorStoreChunkCount,
  listVectorStoreSources,
  type VectorStore,
  type VectorStoreSource,
} from "aihappey-embeddings";
import { useTranslation } from "aihappey-i18n";

export const VectorStoreDetailModal = ({
  open,
  hub,
  onClose,
  onEdit,
}: {
  open: boolean;
  hub?: VectorStore;
  onClose: () => void;
  onEdit: (hub: VectorStore) => void;
  onReplace: (hub: VectorStore) => unknown | Promise<unknown>;
}) => {
  const { Modal, Button, Text, Tabs, Tab, Card, Badge } = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("general");
  const [sources, setSources] = useState<VectorStoreSource[]>([]);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!open || !hub) return;
    setActiveTab("general");
    setError(undefined);
    void listVectorStoreSources(hub).then(setSources).catch((reason) => setError(reason instanceof Error ? reason.message : String(reason)));
  }, [hub?.id, open]);

  if (!hub) return null;

  const chunkCount = getVectorStoreChunkCount(hub);
  const formattedChunkCount = new Intl.NumberFormat(typeof navigator !== "undefined" ? navigator.languages : undefined).format(chunkCount);
  const badges = (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      <Badge size="small" bg="subtle" icon="brain">{hub.model}</Badge>
      <Badge size="small" bg="subtle" icon="chunks" title={`${formattedChunkCount} ${t("vectorStorePage.fields.chunks").toLocaleLowerCase()}`}>
        {formattedChunkCount}
      </Badge>
    </div>
  );

  return (
    <Modal show={open} size="large" onHide={onClose} title={hub.name} actions={<div style={{ display: "flex", gap: 8 }}><Button variant="primary" onClick={() => onEdit(hub)}>{t("vectorStorePage.edit.action")}</Button><Button variant="secondary" onClick={onClose}>{t("close")}</Button></div>}>
      {error ? <Text as="p">{error}</Text> : null}
      <Tabs activeKey={activeTab} onSelect={setActiveTab}>
        <Tab eventKey="general" icon="settings" title={t("vectorStorePage.tabs.general")}>
          <div style={{ display: "grid", gap: 12, paddingTop: 12 }}>
            <Card title={hub.name} description={badges}>
              <div>{hub.description || t("vectorStorePage.general.noDescription")}</div>
            </Card>
          </div>
        </Tab>
        <Tab eventKey="documents" icon="folder" title={`${t("vectorStorePage.tabs.documents")} (${sources.length})`}>
          <div style={{ paddingTop: 16 }}>
            {sources.length ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                {sources.map((source) => <DocumentSourceCard key={source.filename} {...source} labels={{ chunks: t("vectorStorePage.fields.chunks").toLocaleUpperCase(), characters: t("vectorStorePage.fields.characters").toLocaleUpperCase() }} />)}
              </div>
            ) : <Text as="p" align="center">{t("vectorStorePage.documents.empty")}</Text>}
          </div>
        </Tab>
      </Tabs>
    </Modal>
  );
};
