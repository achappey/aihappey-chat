import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { AttachmentButton, DocumentSearchResultCard, FileTags, useTheme } from "aihappey-components";
import {
  getVectorStoreChunkCount,
  searchVectorStoreByMode,
  useVectorStores,
  type VectorStoreSearchResult,
} from "aihappey-embeddings";
import { useTranslation } from "aihappey-i18n";
import { useAppStore } from "aihappey-state";
import { useIsDesktop } from "../../shell/responsive/useIsDesktop";
import { useChatContext } from "../chat/context/ChatContext";
import { extractTextFromFile } from "../chat/files/file";
import { ResizableTextArea } from "../chat/input/ResizableTextArea";
import { useChatFileDrop } from "../chat/input/useChatFileDrop";
import { UserMenuInline } from "../user-settings/UserMenuInline";
import { createVectorStoreEmbeddingClient } from "./embeddingClient";
import { HubSearchSettingsModal, type HubSearchSettings } from "./HubSearchSettingsModal";

type HubSearchResult = VectorStoreSearchResult & {
  hubId: string;
  hubName: string;
};

const DEFAULT_SETTINGS: HubSearchSettings = {
  hubIds: [],
  mode: "fulltext",
  limit: 20,
  similarity: 0.4,
};

export const HubSearchPage = () => {
  const { Button, Spinner, Text, TextArea } = useTheme();
  const { t } = useTranslation();
  const isDesktop = useIsDesktop();
  const hubs = useVectorStores();
  const { config } = useChatContext();
  const customHeaders = useAppStore((state) => state.customHeaders);
  const embed = useMemo(() => createVectorStoreEmbeddingClient(config, customHeaders), [config, customHeaders]);
  const initializedHubSelection = useRef(false);

  const [query, setQuery] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [settings, setSettings] = useState<HubSearchSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [results, setResults] = useState<HubSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [emptyMessage, setEmptyMessage] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const availableIds = new Set(hubs.items.map((hub) => hub.id));
    setSettings((current) => {
      if (!initializedHubSelection.current && hubs.items.length > 0) {
        initializedHubSelection.current = true;
        return { ...current, hubIds: hubs.items.map((hub) => hub.id) };
      }
      const hubIds = current.hubIds.filter((id) => availableIds.has(id));
      return hubIds.length === current.hubIds.length ? current : { ...current, hubIds };
    });
  }, [hubs.items]);

  const clearSearch = () => {
    setResults([]);
    setHasSearched(false);
    setEmptyMessage(undefined);
    setError(undefined);
  };

  const updateSettings = (next: HubSearchSettings) => {
    setSettings(next);
    clearSearch();
  };

  const addAttachments = useCallback((files: File[]) => {
    if (!files.length) return;
    setAttachments((current) => {
      const existingNames = new Set(current.map((file) => file.name));
      return [...current, ...files.filter((file) => !existingNames.has(file.name))];
    });
    clearSearch();
  }, []);

  const removeAttachment = (name: string) => {
    setAttachments((current) => current.filter((file) => file.name !== name));
    clearSearch();
  };

  const { isOver, dropRef: registerDrop, handleDrop, handleDragOver } = useChatFileDrop(
    (file) => addAttachments([file]),
    addAttachments,
  );
  const dropRef = useCallback((node: HTMLDivElement | null) => {
    if (node) registerDrop(node);
  }, [registerDrop]);

  const selectedHubs = hubs.items.filter((hub) => settings.hubIds.includes(hub.id));
  const invalidLimit = !Number.isInteger(settings.limit) || settings.limit < 1;
  const invalidSimilarity = settings.mode !== "fulltext"
    && (!Number.isFinite(settings.similarity) || settings.similarity < 0 || settings.similarity > 1);
  const settingsValid = !invalidLimit && !invalidSimilarity;
  const canSearch = !busy && (!!query.trim() || attachments.length > 0) && selectedHubs.length > 0 && settingsValid;

  const runSearch = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSearch) return;

    setBusy(true);
    setError(undefined);
    setEmptyMessage(undefined);
    setHasSearched(false);
    setResults([]);

    try {
      const searchableHubs = selectedHubs.filter((hub) => getVectorStoreChunkCount(hub) > 0);
      if (!searchableHubs.length) {
        setEmptyMessage(t("hubSearch.noSearchableHubs"));
        setHasSearched(true);
        return;
      }

      const attachmentTexts: string[] = [];
      for (const file of attachments) {
        const text = await extractTextFromFile(file);
        if (!text?.trim()) throw new Error(t("hubSearch.unsupportedAttachment", { name: file.name }));
        attachmentTexts.push(text.trim());
      }
      const term = [...attachmentTexts, query.trim()].filter(Boolean).join("\n\n");

      const vectorsByModel = new Map<string, number[]>();
      if (settings.mode !== "fulltext") {
        await Promise.all(Array.from(new Set(searchableHubs.map((hub) => hub.model))).map(async (model) => {
          const [vector] = await embed(model, [term]);
          vectorsByModel.set(model, vector);
        }));
      }

      const foundByHub = await Promise.all(searchableHubs.map(async (hub) => {
        const found = await searchVectorStoreByMode(hub, term, {
          mode: settings.mode,
          vector: vectorsByModel.get(hub.model),
          limit: settings.limit,
          similarity: settings.similarity,
        });
        return found.map((result) => ({ ...result, hubId: hub.id, hubName: hub.name }));
      }));

      const found = foundByHub
        .flat()
        .sort((left, right) => right.score - left.score)
        .slice(0, settings.limit);
      setResults(found);
      setHasSearched(true);
      if (!found.length) setEmptyMessage(t("hubSearch.noMatches"));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      ref={dropRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={{
        width: "100%",
        minHeight: "100vh",
        boxSizing: "border-box",
        padding: isDesktop ? 0 : "0 12px",
        border: isOver ? "2px dotted" : undefined,
        borderColor: isOver ? "#888" : "transparent",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", padding: isDesktop ? "0 12px" : 0 }}>
        <div style={{ flex: 1 }} />
        <UserMenuInline />
      </div>

      <form onSubmit={runSearch} style={{ maxWidth: 1056, margin: "44px auto 0", display: "flex", flexDirection: "column", gap: 8 }}>
        <h1 style={{ textAlign: "center", marginBottom: 8 }}>{t("hubSearch.title")}</h1>
        <Text as="p" align="center">{t("hubSearch.description")}</Text>
        {attachments.length ? (
          <div style={{ display: "flex", gap: 8, width: "100%" }}>
            <FileTags files={attachments} removeFile={removeAttachment} />
          </div>
        ) : null}
        <ResizableTextArea
          TextArea={TextArea as any}
          autoFocus={isDesktop}
          value={query}
          placeholder={t("hubSearch.placeholder")}
          style={{ resize: "none", width: "100%" }}
          onChange={(value) => {
            setQuery(value);
            clearSearch();
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <AttachmentButton
            icon="attachment"
            disabled={busy}
            onFilesSelected={addAttachments}
          />
          <Button
            type="button"
            icon="settings"
            size="large"
            variant="transparent"
            title={t("hubSearch.settings.title")}
            disabled={busy}
            onClick={() => setSettingsOpen(true)}
          />
          {isOver ? <Text>{t("hubSearch.dropAttachments")}</Text> : null}
          <div style={{ flex: 1 }} />
          <Button
            type="submit"
            icon="search"
            size="large"
            title={busy ? t("hubSearch.searching") : t("search")}
            disabled={!canSearch}
          />
        </div>
        {!hubs.items.length ? <Text as="p" align="center">{t("hubSearch.noHubs")}</Text> : null}
        {hubs.items.length > 0 && !settings.hubIds.length ? <Text as="p" align="center">{t("hubSearch.selectHub")}</Text> : null}
        {invalidLimit ? <Text as="p" align="center">{t("hubSearch.settings.invalidLimit")}</Text> : null}
        {invalidSimilarity ? <Text as="p" align="center">{t("hubSearch.settings.invalidSimilarity")}</Text> : null}
      </form>

      <section
        aria-live="polite"
        aria-busy={busy}
        style={{ maxWidth: 1056, margin: "36px auto 0", paddingBottom: 24 }}
      >
        {busy ? <div style={{ display: "flex", justifyContent: "center" }}><Spinner /></div> : null}
        {error ? <Text as="p" align="center">{error}</Text> : null}
        {hasSearched && emptyMessage ? <Text as="p" align="center">{emptyMessage}</Text> : null}
        {results.length ? (
          <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(2, minmax(0, 1fr))" : "1fr", gap: 16, alignItems: "stretch" }}>
            {results.map((result) => (
              <DocumentSearchResultCard
                key={`${result.hubId}:${result.id}`}
                filename={result.filename}
                content={result.content}
                score={result.score}
                hubName={result.hubName}
                scoreFormat={settings.mode === "fulltext" ? "raw" : "percentage"}
              />
            ))}
          </div>
        ) : null}
      </section>

      <HubSearchSettingsModal
        open={settingsOpen}
        hubs={hubs.items}
        value={settings}
        onChange={updateSettings}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
};
