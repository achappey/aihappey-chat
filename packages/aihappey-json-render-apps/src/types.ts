export type JsonRenderAppStorageKind = "indexeddb" | "local";

export type JsonRenderAppItem = {
  id: string;
  name: string;
  description?: string;
  uiTree: any;
  data?: any;
  dataSource?: JsonRenderAppDataSource | null;
  catalogIds?: string[];
  registryIds?: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type JsonRenderAppDataSource =
  | {
      type: "url";
      config: {
        url: string;
        params?: Record<string, string>;
      };
    }
  | {
      type: "resource";
      config: {
        serverKey: string;
        uri: string;
      };
    }
  | {
      type: "resourceTemplate";
      config: {
        serverKey: string;
        uriTemplate: string;
        params?: Record<string, string>;
      };
    }
  | {
      type: "tool";
      config: {
        name: string;
        params?: Record<string, any>;
      };
    }
  | {
      type: "structuredOutput";
      config: {
        schema: any;
        prompt: string;
        model?: string;
      };
    };

export interface JsonRenderAppsStore {
  readonly kind: JsonRenderAppStorageKind;
  list(): Promise<JsonRenderAppItem[]>;
  read(id: string): Promise<JsonRenderAppItem | undefined>;
  create(
    item: Omit<JsonRenderAppItem, "id" | "createdAt" | "updatedAt">
  ): Promise<JsonRenderAppItem>;
  update(
    id: string,
    item: Omit<JsonRenderAppItem, "id" | "createdAt" | "updatedAt">,
  ): Promise<JsonRenderAppItem>;
  delete(id: string): Promise<void>;
}
