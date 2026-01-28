import type { ComponentType } from "react";

export type JsonRenderRegistryStorageKind = "indexeddb" | "local";

export interface JsonRenderRegistryItem {
  id: string;
  registryId: string;
  name: string;
  code: string;
  propsSchema?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface JsonRenderActionItem {
  id: string;
  registryId: string;
  name: string;
  code: string;
  paramsSchema?: string;
  description?: string;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface JsonRenderRegistryStore {
  kind: JsonRenderRegistryStorageKind;
  add(
    registryId: string,
    name: string,
    code: string,
    propsSchema?: string,
  ): Promise<JsonRenderRegistryItem>;
  update(
    id: string,
    registryId: string,
    name: string,
    code: string,
    propsSchema?: string,
  ): Promise<JsonRenderRegistryItem>;
  list(): Promise<JsonRenderRegistryItem[]>;
  delete(id: string): Promise<void>;
  addAction(
    registryId: string,
    name: string,
    code: string,
    paramsSchema?: string,
    description?: string,
    title?: string,
  ): Promise<JsonRenderActionItem>;
  updateAction(
    id: string,
    registryId: string,
    name: string,
    code: string,
    paramsSchema?: string,
    description?: string,
    title?: string,
  ): Promise<JsonRenderActionItem>;
  listActions(): Promise<JsonRenderActionItem[]>;
  deleteAction(id: string): Promise<void>;
}

export type RuntimeComponentRegistry = Record<string, ComponentType<any>>;

export type RegistryRuntime = Record<string, unknown> & {
  React: typeof import("react");
};

export type ValidationResult = {
  ok: boolean;
  errors: string[];
};

export type RuntimeRegistryError = {
  id: string;
  name: string;
  message: string;
};

export type BuildRuntimeRegistryResult = {
  registry: RuntimeComponentRegistry;
  errors: RuntimeRegistryError[];
};

export type RuntimeActionRegistry = Record<
  string,
  (params: Record<string, unknown>) => Promise<unknown> | unknown
>;

export type RuntimeActionError = {
  id: string;
  name: string;
  message: string;
};

export type BuildRuntimeActionRegistryResult = {
  handlers: RuntimeActionRegistry;
  errors: RuntimeActionError[];
};
