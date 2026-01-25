export type StructuredOutputsStorageKind = "indexeddb" | "local";

export interface StructuredOutputsItem {
  id: string;
  name: string;
  json_schema: string;
}

export interface StructuredOutputsStore {
  kind: StructuredOutputsStorageKind;
  add(
    name: string,
    json_schema: string,
  ): Promise<StructuredOutputsItem>;
  update(
    id: string,
    name: string,
    json_schema: string,
  ): Promise<StructuredOutputsItem>;
  list(): Promise<StructuredOutputsItem[]>;
  delete(id: string): Promise<void>;
}
