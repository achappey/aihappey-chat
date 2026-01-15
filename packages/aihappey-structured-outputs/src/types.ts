export type StructuredOutputsStorageKind = "indexeddb" | "local";

export interface StructuredOutputsItem {
  id: string;
  json_schema: string;
  output: any;
}

export interface StructuredOutputsStore {
  kind: StructuredOutputsStorageKind;
  add(
    json_schema: string,
    output: any,
  ): Promise<StructuredOutputsItem>;
  list(): Promise<StructuredOutputsItem[]>;
  delete(id: string): Promise<void>;
}
