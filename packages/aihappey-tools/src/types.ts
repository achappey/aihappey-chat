// types.ts

export type ToolStorageKind = "local" | "indexeddb";

export type StoredTool = {
  id: string;                  // hash or uuid
  description: string;
  title?: string;
  inputSchema: string;     // JSON Schema (string)
  execute: string;       // async fn source (string)
};

export interface ToolStore {
  readonly kind: ToolStorageKind;

  add(tool: StoredTool): Promise<StoredTool>;
  list(): Promise<StoredTool[]>;
  delete(id: string): Promise<void>;
}
