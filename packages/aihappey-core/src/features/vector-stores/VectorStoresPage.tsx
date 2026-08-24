import { useEffect, useMemo, useState } from "react";
import { VectorStoreCard, StickyHeaderActionBar, useTheme } from "aihappey-components";
import {
  chunkText,
  insertVectorStoreChunks,
  listVectorStoreSources,
  parseVectorStore,
  removeVectorStoreSource,
  serializeVectorStore,
  useVectorStores,
  vectorStoreJsonFilename,
  VectorStoreJsonError,
  type VectorStore,
} from "aihappey-embeddings";
import { useAppStore } from "aihappey-state";
import { useChatContext } from "../chat/context/ChatContext";
import { OverviewPageHeader } from "../../ui/layout/OverviewPageHeader";
import { useIsDesktop } from "../../shell/responsive/useIsDesktop";
import { VectorStoreEditModal, type VectorStoreEditSaveValue } from "./VectorStoreEditModal";
import { createVectorStoreEmbeddingClient } from "./embeddingClient";
import { useTranslation } from "aihappey-i18n";
import { VectorStoreDetailModal } from "./VectorStoreDetailModal";
import { extractTextFromFile } from "../chat/files/file";

const EMBEDDING_BATCH_SIZE = 32;

export const VectorStoresPage = () => {
  const { Alert, SearchBox, Text } = useTheme();
  const isDesktop = useIsDesktop();
  const { t } = useTranslation();
  const hubs = useVectorStores();
  const models = useAppStore((state) => state.models);
  const userPreferredEmbeddingModel = useAppStore((state) => state.userPreferredEmbeddingModel);
  const customHeaders = useAppStore((state) => state.customHeaders);
  const { config } = useChatContext();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VectorStore | undefined>();
  const [viewingId, setViewingId] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [importError, setImportError] = useState<string>();
  const [isDragging, setIsDragging] = useState(false);
  const [fileCounts, setFileCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let active = true;
    void Promise.all(hubs.items.map(async (hub) => [hub.id, (await listVectorStoreSources(hub)).length] as const))
      .then((entries) => { if (active) setFileCounts(Object.fromEntries(entries)); })
      .catch(() => { if (active) setFileCounts({}); });
    return () => { active = false; };
  }, [hubs.items]);

  const visible = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return hubs.items;
    return hubs.items.filter((hub) => `${hub.name}\n${hub.description}`.toLocaleLowerCase().includes(term));
  }, [hubs.items, search]);

  const openCreate = () => { setEditing(undefined); setError(undefined); setModalOpen(true); };
  const openEdit = (hub: VectorStore) => { setEditing(hub); setError(undefined); setModalOpen(true); };

  const downloadHub = (hub: VectorStore) => {
    const blob = new Blob([serializeVectorStore(hub)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = vectorStoreJsonFilename(hub);
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const importHubs = async (files: File[]) => {
    setImportError(undefined);
    const failures: string[] = [];
    for (const file of files) {
      if (!file.name.toLocaleLowerCase().endsWith(".json")) {
        failures.push(t("vectorStorePage.import.invalidType", { name: file.name }));
        continue;
      }
      try {
        const hub = parseVectorStore(await file.text());
        await hubs.upsert(hub);
      } catch (cause) {
        const key = cause instanceof VectorStoreJsonError
          ? cause.code === "invalid-json"
            ? "invalidJson"
            : cause.code === "invalid-index"
              ? "invalidIndex"
              : "invalidHub"
          : "failed";
        failures.push(t(`vectorStorePage.import.${key}`, { name: file.name }));
      }
    }
    if (failures.length) setImportError(failures.join(" "));
  };

  const saveHub = async (value: VectorStoreEditSaveValue) => {
    setBusy(true);
    setError(undefined);
    try {
      const { addedFiles, removedSources, ...formValue } = value;
      let saved: VectorStore;
      if (editing) {
        saved = await hubs.update(editing.id, formValue);
      } else {
        const embed = createVectorStoreEmbeddingClient(config, customHeaders);
        const probeText = [value.name.trim(), value.description.trim()].filter(Boolean).join("\n\n");
        const [vector] = await embed(value.model, [probeText || value.name]);
        saved = await hubs.add({ ...formValue, vectorSize: vector.length });
      }
      for (const filename of removedSources) saved = await removeVectorStoreSource(saved, filename);
      if (addedFiles.length) {
        const embed = createVectorStoreEmbeddingClient(config, customHeaders);
        const plainChunks: { filename: string; content: string }[] = [];
        for (const file of addedFiles) {
          const content = await extractTextFromFile(file);
          if (!content?.trim()) throw new Error(t("vectorStorePage.errors.unsupportedDocument", { name: file.name }));
          for (const contentChunk of chunkText(content, saved.chunkSize, saved.chunkOverlap)) plainChunks.push({ filename: file.name, content: contentChunk });
        }
        if (!plainChunks.length) throw new Error(t("vectorStorePage.errors.noChunks"));
        const chunks: { filename: string; content: string; embedding: number[] }[] = [];
        for (let start = 0; start < plainChunks.length; start += EMBEDDING_BATCH_SIZE) {
          const batch = plainChunks.slice(start, start + EMBEDDING_BATCH_SIZE);
          const vectors = await embed(saved.model, batch.map((chunk) => chunk.content));
          vectors.forEach((embedding, index) => chunks.push({ ...batch[index], embedding }));
        }
        saved = await insertVectorStoreChunks(saved, chunks);
      }
      if (removedSources.length || addedFiles.length) await hubs.replace(saved);
      setModalOpen(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        void importHubs(Array.from(event.dataTransfer.files));
      }}
      style={{ minHeight: "100%", border: isDragging ? "2px dashed #888" : "2px solid transparent", boxSizing: "border-box" }}
    >
      <StickyHeaderActionBar actionLabel={t("add")} onAction={openCreate} />
      <div style={{ width: 900, maxWidth: "100%", margin: "0 auto", padding: isDesktop ? 0 : 12, boxSizing: "border-box" }}>
        <OverviewPageHeader title={t('vectorStores')} />
        <Text as="p" align="center">{t('vectorStorePage.description')}</Text>
        {importError && <Alert variant="danger"><span role="alert">{importError}</span></Alert>}
        <div style={{ width: 360, maxWidth: "100%", margin: "0 auto 20px" }}>
          <SearchBox value={search} onChange={setSearch}
            placeholder={t("vectorStorePage.overview.searchPlaceholder")} autoFocus={isDesktop} />
        </div>
        {visible.length ? <div style={{ width: "100%", display: "grid", gridTemplateColumns: isDesktop ? "repeat(2, minmax(0, 1fr))" : "1fr", gap: 16 }}>
          {visible.map((hub) => <VectorStoreCard key={hub.id} name={hub.name} description={hub.description} model={hub.model} size={new TextEncoder().encode(JSON.stringify(hub)).length} fileCount={fileCounts[hub.id] ?? 0} onView={() => setViewingId(hub.id)} onDownload={() => downloadHub(hub)} onDelete={() => void hubs.delete(hub.id)} labels={{ files: t("vectorStorePage.tabs.documents"), view: t("view"), download: t("download"), delete: t("delete") }} />)}
        </div> : <Text as="p" align="center">{t("vectorStorePage.overview.empty")}</Text>}
      </div>
      <VectorStoreEditModal open={modalOpen} hub={editing} models={models ?? []} defaultModel={userPreferredEmbeddingModel} busy={busy} error={error} onClose={() => setModalOpen(false)} onSave={saveHub} />
      <VectorStoreDetailModal open={!!viewingId} hub={hubs.items.find((hub) => hub.id === viewingId)} onClose={() => setViewingId(undefined)} onEdit={(hub) => { setViewingId(undefined); openEdit(hub); }} onReplace={hubs.replace} />
    </div>
  );
};
