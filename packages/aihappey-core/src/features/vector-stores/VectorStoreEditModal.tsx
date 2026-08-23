import { useEffect, useRef, useState } from "react";
import type { VectorStore, VectorStoreSource } from "aihappey-embeddings";
import { listVectorStoreSources } from "aihappey-embeddings";
import { DocumentSourceCard, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { ModelSelect } from "../models/ModelSelect";
import type { ModelOption } from "aihappey-types";

export type VectorStoreFormValue = {
  name: string;
  description: string;
  chunkSize: number;
  chunkOverlap: number;
  model: string;
};

export type VectorStoreEditSaveValue = VectorStoreFormValue & {
  addedFiles: File[];
  removedSources: string[];
};

export const VectorStoreEditModal = ({ open, hub, models, defaultModel, busy, error, onClose, onSave }: {
  open: boolean;
  hub?: VectorStore;
  models: ModelOption[];
  defaultModel?: string;
  busy?: boolean;
  error?: string;
  onClose: () => void;
  onSave: (value: VectorStoreEditSaveValue) => void | Promise<void>;
}) => {
  const { Modal, Button, Tabs, Tab, Input, TextArea, Text, Card } = useTheme();
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("general");
  const [value, setValue] = useState<VectorStoreFormValue>({ name: "", description: "", chunkSize: 1000, chunkOverlap: 200, model: "" });
  const [sources, setSources] = useState<VectorStoreSource[]>([]);
  const [addedFiles, setAddedFiles] = useState<File[]>([]);
  const [removedSources, setRemovedSources] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!open) return;
    setActiveTab("general");
    setValue(hub ? { name: hub.name, description: hub.description, chunkSize: hub.chunkSize, chunkOverlap: hub.chunkOverlap, model: hub.model } : { name: "", description: "", chunkSize: 1000, chunkOverlap: 200, model: defaultModel ?? "" });
    setAddedFiles([]);
    setRemovedSources([]);
    setIsDragging(false);
    if (hub) void listVectorStoreSources(hub).then(setSources);
    else setSources([]);
  }, [defaultModel, hub, open]);

  const visibleSources = sources.filter((source) => !removedSources.includes(source.filename));
  const hasDocuments = visibleSources.length > 0;
  const valid = value.name.trim() && value.model.trim() && value.chunkSize > 0 && value.chunkOverlap >= 0 && value.chunkOverlap < value.chunkSize;
  const addFiles = (files: File[]) => setAddedFiles((current) => {
    const next = new Map(current.map((file) => [file.name.toLocaleLowerCase(), file]));
    files.forEach((file) => next.set(file.name.toLocaleLowerCase(), file));
    return Array.from(next.values());
  });

  return <Modal show={open} size="large" onHide={onClose} title={hub?.name ?? t("vectorStorePage.edit.newTitle")} actions={<div style={{ display: "flex", gap: 8 }}><Button variant="subtle" disabled={busy} onClick={onClose}>{t("cancel")}</Button><Button variant="primary" disabled={!valid || busy} onClick={() => onSave({ ...value, addedFiles, removedSources })}>{busy ? t("vectorStorePage.edit.saving") : t("save")}</Button></div>}>
    {error ? <Text as="p">{error}</Text> : null}
    <Tabs activeKey={activeTab} onSelect={setActiveTab}>
      <Tab eventKey="general" icon="settings" title={t("general")}><div style={{ display: "grid", gap: 12, paddingTop: 12 }}>
        <Input label={t("name")} value={value.name} required onChange={(event) => setValue((current) => ({ ...current, name: event.target.value }))} />
        <TextArea label={t("description")} value={value.description} rows={5} onChange={(description) => setValue((current) => ({ ...current, description }))} />
        <ModelSelect label={t("model")} models={models} modelTypes={["embedding"]} value={value.model} onChange={(model) => setValue((current) => ({ ...current, model }))} disabled={!!hub} />
        <Input label={t("vectorStorePage.fields.chunkSize")} type="number" min={1} value={value.chunkSize} disabled={hasDocuments} onChange={(event) => setValue((current) => ({ ...current, chunkSize: Number(event.target.value) }))} />
        <Input label={t("vectorStorePage.fields.chunkOverlap")} type="number" min={0} value={value.chunkOverlap} disabled={hasDocuments} onChange={(event) => setValue((current) => ({ ...current, chunkOverlap: Number(event.target.value) }))} />
        {hasDocuments ? <Text as="p">{t("vectorStorePage.edit.chunkSettingsLocked")}</Text> : null}
      </div></Tab>
      <Tab eventKey="documents" icon="folder" title={t("vectorStorePage.tabs.documents")}><div style={{ display: "grid", gap: 12, paddingTop: 12 }}>
        <input ref={inputRef} hidden multiple type="file" accept=".pdf,.docx,.xlsx,.xls,.csv,.epub,.pptx,.txt,.md,.log,.eml,.msg,text/*" onChange={(event) => { addFiles(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
        <div style={{ border: `2px dashed ${isDragging ? "currentColor" : "rgba(127,127,127,.45)"}`, borderRadius: 8, padding: 24, textAlign: "center" }} onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setIsDragging(false)} onDrop={(event) => { event.preventDefault(); setIsDragging(false); addFiles(Array.from(event.dataTransfer.files)); }}>
          <div style={{ marginBottom: 8 }}>{t("vectorStorePage.edit.dropDocuments")}</div>
          <Button variant="secondary" onClick={() => inputRef.current?.click()}>{t("vectorStorePage.edit.chooseDocuments")}</Button>
        </div>
        {!visibleSources.length && !addedFiles.length ? <Card title={t("vectorStorePage.tabs.documents")}><div style={{ color: "#888" }}>{t("noResults")}</div></Card> : null}
        {visibleSources.map((source) => <DocumentSourceCard key={source.filename} {...source} labels={{ chunks: t("vectorStorePage.fields.chunks").toLocaleLowerCase(), characters: t("vectorStorePage.fields.characters").toLocaleLowerCase(), delete: t("delete") }} onDelete={() => setRemovedSources((current) => [...current, source.filename])} />)}
        {addedFiles.map((file) => <Card key={file.name} title={file.name} description={t("vectorStorePage.edit.stagedDocument")} actions={<Button icon="delete" size="small" variant="transparent" title={t("delete")} onClick={() => setAddedFiles((current) => current.filter((item) => item !== file))} />} />)}
      </div></Tab>
    </Tabs>
  </Modal>;
};
