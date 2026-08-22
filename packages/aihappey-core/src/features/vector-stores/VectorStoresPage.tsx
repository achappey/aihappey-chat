import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { VectorStoreCard, StickyHeaderActionBar, useTheme } from "aihappey-components";
import {
  getVectorStoreChunkCount,
  useVectorStores,
  type VectorStore,
} from "aihappey-embeddings";
import { useAppStore } from "aihappey-state";
import { useChatContext } from "../chat/context/ChatContext";
import { OverviewPageHeader } from "../../ui/layout/OverviewPageHeader";
import { useIsDesktop } from "../../shell/responsive/useIsDesktop";
import { VectorStoreEditModal, type VectorStoreFormValue } from "./VectorStoreEditModal";
import { createVectorStoreEmbeddingClient } from "./embeddingClient";
import { useTranslation } from "aihappey-i18n";

export const VectorStoresPage = () => {
  const { SearchBox, Text } = useTheme();
  const isDesktop = useIsDesktop();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const hubs = useVectorStores();
  const models = useAppStore((state) => state.models);
  const customHeaders = useAppStore((state) => state.customHeaders);
  const { config } = useChatContext();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VectorStore | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const visible = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return hubs.items;
    return hubs.items.filter((hub) => `${hub.name}\n${hub.description}`.toLocaleLowerCase().includes(term));
  }, [hubs.items, search]);

  const openCreate = () => { setEditing(undefined); setError(undefined); setModalOpen(true); };
  const openEdit = (hub: VectorStore) => { setEditing(hub); setError(undefined); setModalOpen(true); };
  const saveHub = async (value: VectorStoreFormValue) => {
    setBusy(true);
    setError(undefined);
    try {
      if (editing) {
        await hubs.update(editing.id, value);
      } else {
        const embed = createVectorStoreEmbeddingClient(config, customHeaders);
        const probeText = [value.name.trim(), value.description.trim()].filter(Boolean).join("\n\n");
        const [vector] = await embed(value.model, [probeText || value.name]);
        await hubs.add({ ...value, vectorSize: vector.length });
      }
      setModalOpen(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <StickyHeaderActionBar actionLabel="Add" onAction={openCreate} />
      <div style={{ width: 900, maxWidth: "100%", margin: "0 auto", padding: isDesktop ? 0 : 12, boxSizing: "border-box" }}>
        <OverviewPageHeader title={t('vectorStores')} />
        <Text as="p" align="center">{t('vectorStorePage.description')}</Text>
        <div style={{ width: 360, maxWidth: "100%", margin: "0 auto 20px" }}>
          <SearchBox value={search} onChange={setSearch}
            placeholder="Search document hubs" autoFocus={isDesktop} />
        </div>
        {visible.length ? <div style={{ width: "100%", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: 16 }}>
          {visible.map((hub) => <VectorStoreCard key={hub.id} name={hub.name} description={hub.description} model={hub.model} chunks={getVectorStoreChunkCount(hub)} onOpen={() => navigate(`/file-search/${encodeURIComponent(hub.id)}`)} onEdit={() => openEdit(hub)} onDelete={() => void hubs.delete(hub.id)} />)}
        </div> : <Text as="p" align="center">No document hubs found.</Text>}
      </div>
      <VectorStoreEditModal open={modalOpen} hub={editing} hasChunks={editing ? getVectorStoreChunkCount(editing) > 0 : false} models={models ?? []} busy={busy} error={error} onClose={() => setModalOpen(false)} onSave={saveHub} />
    </>
  );
};
