import { useEffect, useState } from "react";
import type { VectorStore } from "aihappey-embeddings";
import { useTheme } from "aihappey-components";
import { ModelSelect } from "../models/ModelSelect";
import type { ModelOption } from "aihappey-types";

export type VectorStoreFormValue = {
  name: string;
  description: string;
  chunkSize: number;
  chunkOverlap: number;
  model: string;
};

export const VectorStoreEditModal = ({
  open,
  hub,
  hasChunks,
  models,
  busy,
  error,
  onClose,
  onSave,
}: {
  open: boolean;
  hub?: VectorStore;
  hasChunks: boolean;
  models: ModelOption[];
  busy?: boolean;
  error?: string;
  onClose: () => void;
  onSave: (value: VectorStoreFormValue) => void | Promise<void>;
}) => {
  const { Modal, Button, Input, TextArea, Text } = useTheme();
  const [value, setValue] = useState<VectorStoreFormValue>({ name: "", description: "", chunkSize: 1000, chunkOverlap: 200, model: "" });
  useEffect(() => {
    if (!open) return;
    setValue(hub ? {
      name: hub.name,
      description: hub.description,
      chunkSize: hub.chunkSize,
      chunkOverlap: hub.chunkOverlap,
      model: hub.model,
    } : { name: "", description: "", chunkSize: 1000, chunkOverlap: 200, model: "" });
  }, [hub, open]);

  const valid = value.name.trim() && value.model.trim() && value.chunkSize > 0 && value.chunkOverlap >= 0 && value.chunkOverlap < value.chunkSize;
  return (
    <Modal show={open} onHide={onClose} title={hub ? "Edit document hub" : "New document hub"} actions={<><Button variant="subtle" onClick={onClose}>Cancel</Button><Button disabled={!valid || busy} onClick={() => onSave(value)}>{busy ? "Saving…" : "Save"}</Button></>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {error ? <Text as="p">{error}</Text> : null}
        <Input label="Name" value={value.name} required onChange={(event) => setValue((current) => ({ ...current, name: event.target.value }))} />
        <TextArea label="Description" value={value.description} rows={4} onChange={(description) => setValue((current) => ({ ...current, description }))} />
        <ModelSelect label="Embedding model" models={models} modelTypes={["embedding"]} value={value.model} onChange={(model) => setValue((current) => ({ ...current, model }))} disabled={!!hub} />
        <Input label="Chunk size (characters)" type="number" min={1} value={value.chunkSize} disabled={hasChunks} onChange={(event) => setValue((current) => ({ ...current, chunkSize: Number(event.target.value) }))} />
        <Input label="Chunk overlap (characters)" type="number" min={0} value={value.chunkOverlap} disabled={hasChunks} onChange={(event) => setValue((current) => ({ ...current, chunkOverlap: Number(event.target.value) }))} />
        {hasChunks ? <Text as="p">Chunk settings are read-only while this hub contains documents.</Text> : null}
      </div>
    </Modal>
  );
};
