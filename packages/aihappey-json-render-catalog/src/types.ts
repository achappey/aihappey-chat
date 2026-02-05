import type { ZodTypeAny } from "zod";

export type JsonRenderCatalogStorageKind = "indexeddb" | "local";

export type JsonRenderCatalogComponent = {
  name: string;
  propsSchema: string;
  description?: string;
  hasChildren?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type JsonRenderCatalogAction = {
  name: string;
  paramsSchema?: string;
  description?: string;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type JsonRenderCatalogValidationFunction = {
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type JsonRenderCatalogItem = {
  id: string;
  name: string;
  manageable?: boolean;
  components: JsonRenderCatalogComponent[];
  actions: JsonRenderCatalogAction[];
  validationFunctions: JsonRenderCatalogValidationFunction[];
  createdAt?: string;
  updatedAt?: string;
};

export type RuntimeCatalogComponentDefinition = {
  props: ZodTypeAny;
  description?: string;
  slots?: string[];
};

export type RuntimeCatalogActionDefinition = {
  params: ZodTypeAny;
  description?: string;
};

export type RuntimeCatalogValidationFunction = {
  description?: string;
};

export type RuntimeCatalogDefinitions = {
  name: string;
  manageable?: boolean;
  components: Record<string, RuntimeCatalogComponentDefinition>;
  actions: Record<string, RuntimeCatalogActionDefinition>;
  validationFunctions: Record<string, RuntimeCatalogValidationFunction>;
};

export interface JsonRenderCatalogStore {
  readonly kind: JsonRenderCatalogStorageKind;
  list(): Promise<JsonRenderCatalogItem[]>;
  read(id: string): Promise<JsonRenderCatalogItem | undefined>;
  create(item: Omit<JsonRenderCatalogItem, "id" | "createdAt" | "updatedAt">): Promise<JsonRenderCatalogItem>;
  update(id: string, item: Omit<JsonRenderCatalogItem, "id" | "createdAt" | "updatedAt">): Promise<JsonRenderCatalogItem>;
  delete(id: string): Promise<void>;
}
