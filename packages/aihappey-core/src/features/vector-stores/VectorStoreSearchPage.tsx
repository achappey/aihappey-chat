import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { DocumentSearchResultCard, DocumentSourceCard, useTheme } from "aihappey-components";
import {
  chunkText,
  getVectorStoreChunkCount,
  getVectorStoreVectorSize,
  insertVectorStoreChunks,
  listVectorStoreSources,
  removeVectorStoreSource,
  searchVectorStore,
  useVectorStores,
  type VectorStoreSearchResult,
  type VectorStoreSource,
} from "aihappey-embeddings";
import { useAppStore } from "aihappey-state";
import { useChatContext } from "../chat/context/ChatContext";
import { extractTextFromFile } from "../chat/files/file";
import { createVectorStoreEmbeddingClient } from "./embeddingClient";
import { OverviewPageHeader } from "../../ui/layout/OverviewPageHeader";

const EMBEDDING_BATCH_SIZE = 32;

export const VectorStoreSearchPage = () => {
  const { hubId = "" } = useParams();
  const navigate = useNavigate();
  const hubs = useVectorStores();
  const hub = hubs.items.find((item) => item.id === hubId);
  const { Button, Input, Text } = useTheme();
  const customHeaders = useAppStore((state) => state.customHeaders);
  const { config } = useChatContext();
  const fileInput = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [sources, setSources] = useState<VectorStoreSource[]>([]);
  const [results, setResults] = useState<VectorStoreSearchResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const embed = useMemo(() => createVectorStoreEmbeddingClient(config, customHeaders), [config, customHeaders]);

  useEffect(() => { if (hub) void listVectorStoreSources(hub).then(setSources); }, [hub]);
  if (!hub) return <div style={{ padding: 24 }}><Text as="p">Document hub not found.</Text><Button onClick={() => navigate("/file-search")}>Back</Button></div>;

  const indexFiles = async (files: File[]) => {
    setBusy(true); setError(undefined);
    try {
      const plainChunks: { filename: string; content: string }[] = [];
      for (const file of files) {
        const content = await extractTextFromFile(file);
        if (!content?.trim()) throw new Error(`Unsupported or empty document: ${file.name}`);
        for (const chunk of chunkText(content, hub.chunkSize, hub.chunkOverlap)) plainChunks.push({ filename: file.name, content: chunk });
      }
      if (!plainChunks.length) throw new Error("No text chunks were produced.");
      const chunks = [] as { filename: string; content: string; embedding: number[] }[];
      for (let start = 0; start < plainChunks.length; start += EMBEDDING_BATCH_SIZE) {
        const batch = plainChunks.slice(start, start + EMBEDDING_BATCH_SIZE);
        const vectors = await embed(hub.model, batch.map((chunk) => chunk.content));
        vectors.forEach((embedding, index) => chunks.push({ ...batch[index], embedding }));
      }
      const next = await insertVectorStoreChunks(hub, chunks);
      await hubs.replace(next);
      setSources(await listVectorStoreSources(next));
    } catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); }
    finally { setBusy(false); if (fileInput.current) fileInput.current.value = ""; }
  };

  const runSearch = async () => {
    if (!query.trim() || !getVectorStoreChunkCount(hub)) return;
    setBusy(true); setError(undefined);
    try {
      const [vector] = await embed(hub.model, [query.trim()]);
      setResults(await searchVectorStore(hub, vector));
    } catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); }
    finally { setBusy(false); }
  };

  const groupedResults = results.reduce((map, result) => {
    const list = map.get(result.filename) ?? [];
    list.push(result); map.set(result.filename, list); return map;
  }, new Map<string, VectorStoreSearchResult[]>());

  return <div style={{ width: 1000, maxWidth: "100%", margin: "0 auto", padding: 12, boxSizing: "border-box" }}>
    <OverviewPageHeader title={hub.name} />
    <Text as="p" align="center">{hub.description || `Semantic search with ${hub.model}`}</Text>
    {error ? <Text as="p">{error}</Text> : null}
    <div style={{ display: "flex", gap: 8, maxWidth: 760, margin: "24px auto" }}>
      <Input aria-label="Search documents" placeholder="Search this document hub" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void runSearch()} />
      <Button icon="search" disabled={busy || !query.trim() || !getVectorStoreChunkCount(hub)} onClick={() => void runSearch()}>Search</Button>
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "28px 0 12px" }}><Text as="h2">Documents ({sources.length})</Text><><input ref={fileInput} hidden multiple type="file" accept=".pdf,.docx,.xlsx,.xls,.csv,.epub,.pptx,.txt,.md,.log,.eml,.msg,text/*" onChange={(event) => void indexFiles(Array.from(event.target.files ?? []))} /><Button icon="add" disabled={busy} onClick={() => fileInput.current?.click()}>{busy ? "Processing…" : "Add documents"}</Button></></div>
    {sources.length ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>{sources.map((source) => <DocumentSourceCard key={source.filename} {...source} onDelete={() => void (async () => { const next = await removeVectorStoreSource(hub, source.filename); await hubs.replace(next); setSources(await listVectorStoreSources(next)); setResults([]); })()} />)}</div> : <Text as="p">Add documents to begin searching. Vector size: {getVectorStoreVectorSize(hub)}.</Text>}
    {Array.from(groupedResults.entries()).map(([filename, items]) => <section key={filename} style={{ marginTop: 28 }}><Text as="h2">{filename}</Text><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>{items.map((result) => <DocumentSearchResultCard key={result.id} {...result} />)}</div></section>)}
  </div>;
};
