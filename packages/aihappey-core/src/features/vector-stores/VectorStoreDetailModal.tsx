import { useEffect, useMemo, useRef, useState } from "react";
import { DocumentSearchResultCard, DocumentSourceCard, useTheme } from "aihappey-components";
import {
  chunkText,
  getVectorStoreChunkCount,
  getVectorStoreVectorSize,
  insertVectorStoreChunks,
  listVectorStoreSources,
  removeVectorStoreSource,
  searchVectorStore,
  type VectorStore,
  type VectorStoreSearchResult,
  type VectorStoreSource,
} from "aihappey-embeddings";
import { useTranslation } from "aihappey-i18n";
import { useAppStore } from "aihappey-state";
import { useChatContext } from "../chat/context/ChatContext";
import { extractTextFromFile } from "../chat/files/file";
import { createVectorStoreEmbeddingClient } from "./embeddingClient";

const EMBEDDING_BATCH_SIZE = 32;

export const VectorStoreDetailModal = ({
  open,
  hub,
  onClose,
  onEdit,
  onReplace,
}: {
  open: boolean;
  hub?: VectorStore;
  onClose: () => void;
  onEdit: (hub: VectorStore) => void;
  onReplace: (hub: VectorStore) => unknown | Promise<unknown>;
}) => {
  const { Modal, Button, Input, Text, Tabs, Tab, Card, Badge, Spinner } = useTheme();
  const { t } = useTranslation();
  const customHeaders = useAppStore((state) => state.customHeaders);
  const { config } = useChatContext();
  const fileInput = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("general");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(20);
  const [similarity, setSimilarity] = useState(0.7);
  const [sources, setSources] = useState<VectorStoreSource[]>([]);
  const [results, setResults] = useState<VectorStoreSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const embed = useMemo(() => createVectorStoreEmbeddingClient(config, customHeaders), [config, customHeaders]);

  useEffect(() => {
    if (!open || !hub) return;
    setActiveTab("general");
    setQuery("");
    setLimit(20);
    setSimilarity(0.7);
    setResults([]);
    setHasSearched(false);
    setError(undefined);
    void listVectorStoreSources(hub).then(setSources).catch((reason) => setError(reason instanceof Error ? reason.message : String(reason)));
  }, [hub?.id, open]);

  if (!hub) return null;

  const clearSearch = () => {
    setResults([]);
    setHasSearched(false);
  };

  const indexFiles = async (files: File[]) => {
    setBusy(true);
    setError(undefined);
    try {
      const plainChunks: { filename: string; content: string }[] = [];
      for (const file of files) {
        const content = await extractTextFromFile(file);
        if (!content?.trim()) throw new Error(t("vectorStorePage.errors.unsupportedDocument", { name: file.name }));
        for (const contentChunk of chunkText(content, hub.chunkSize, hub.chunkOverlap)) {
          plainChunks.push({ filename: file.name, content: contentChunk });
        }
      }
      if (!plainChunks.length) throw new Error(t("vectorStorePage.errors.noChunks"));
      const chunks: { filename: string; content: string; embedding: number[] }[] = [];
      for (let start = 0; start < plainChunks.length; start += EMBEDDING_BATCH_SIZE) {
        const batch = plainChunks.slice(start, start + EMBEDDING_BATCH_SIZE);
        const vectors = await embed(hub.model, batch.map((chunk) => chunk.content));
        vectors.forEach((embedding, index) => chunks.push({ ...batch[index], embedding }));
      }
      const next = await insertVectorStoreChunks(hub, chunks);
      await onReplace(next);
      setSources(await listVectorStoreSources(next));
      clearSearch();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const deleteSource = async (filename: string) => {
    setBusy(true);
    setError(undefined);
    try {
      const next = await removeVectorStoreSource(hub, filename);
      await onReplace(next);
      setSources(await listVectorStoreSources(next));
      clearSearch();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy(false);
    }
  };

  const runSearch = async () => {
    if (!query.trim() || !getVectorStoreChunkCount(hub) || limit < 1 || similarity < 0 || similarity > 1) return;
    setBusy(true);
    setError(undefined);
    setHasSearched(false);
    setResults([]);
    try {
      const [vector] = await embed(hub.model, [query.trim()]);
      const found = await searchVectorStore(hub, vector, { limit, similarity });
      setResults(found);
      setHasSearched(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy(false);
    }
  };

  const groupedResults = results.reduce((map, result) => {
    const items = map.get(result.filename) ?? [];
    items.push(result);
    map.set(result.filename, items);
    return map;
  }, new Map<string, VectorStoreSearchResult[]>());

  const badges = (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      <Badge size="small" bg="subtle" icon="brain">{hub.model}</Badge>
      <Badge size="small" bg="subtle">{t("vectorStorePage.fields.vectorSize")}: {getVectorStoreVectorSize(hub)}</Badge>
      <Badge size="small" bg="subtle">{t("vectorStorePage.fields.chunks")}: {getVectorStoreChunkCount(hub)}</Badge>
      <Badge size="small" bg="subtle">{t("vectorStorePage.fields.chunkSize")}: {hub.chunkSize}</Badge>
      <Badge size="small" bg="subtle">{t("vectorStorePage.fields.chunkOverlap")}: {hub.chunkOverlap}</Badge>
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
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
              <input ref={fileInput} hidden multiple type="file" accept=".pdf,.docx,.xlsx,.xls,.csv,.epub,.pptx,.txt,.md,.log,.eml,.msg,text/*" onChange={(event) => void indexFiles(Array.from(event.target.files ?? []))} />
              <Button icon="add" disabled={busy} onClick={() => fileInput.current?.click()}>{busy ? t("vectorStorePage.processing") : t("vectorStorePage.documents.add")}</Button>
            </div>
            {busy ? <Spinner /> : sources.length ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                {sources.map((source) => <DocumentSourceCard key={source.filename} {...source} labels={{ chunks: t("vectorStorePage.fields.chunks").toLocaleLowerCase(), characters: t("vectorStorePage.fields.characters").toLocaleLowerCase(), delete: t("delete") }} onDelete={() => void deleteSource(source.filename)} />)}
              </div>
            ) : <Text as="p" align="center">{t("vectorStorePage.documents.empty")}</Text>}
          </div>
        </Tab>
        <Tab eventKey="search" icon="search" title={t("vectorStorePage.tabs.search")}>
          <div style={{ paddingTop: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1fr) auto", gap: 8, alignItems: "end" }}>
              <Input label={t("vectorStorePage.search.query")} placeholder={t("vectorStorePage.search.placeholder")} value={query} onChange={(event) => { setQuery(event.target.value); clearSearch(); }} onKeyDown={(event) => event.key === "Enter" && void runSearch()} />
              <Button icon="search" disabled={busy || !query.trim() || !getVectorStoreChunkCount(hub) || limit < 1 || similarity < 0 || similarity > 1} onClick={() => void runSearch()}>{busy ? t("vectorStorePage.search.searching") : t("search")}</Button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8, marginTop: 12 }}>
              <Input label={t("vectorStorePage.search.limit")} type="number" min={1} value={limit} onChange={(event) => { setLimit(Number(event.target.value)); clearSearch(); }} />
              <Input label={t("vectorStorePage.search.similarity")} type="number" min={0} max={1} step={0.05} value={similarity} onChange={(event) => { setSimilarity(Number(event.target.value)); clearSearch(); }} />
            </div>
            {hasSearched && !results.length ? <Text as="p" align="center">{t("vectorStorePage.search.noMatches")}</Text> : null}
            {hasSearched && results.length ? Array.from(groupedResults.entries()).map(([filename, items]) => (
              <section key={filename} style={{ marginTop: 24 }}><Text as="h3">{filename}</Text><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>{items.map((result) => <DocumentSearchResultCard key={result.id} {...result} />)}</div></section>
            )) : null}
          </div>
        </Tab>
      </Tabs>
    </Modal>
  );
};
