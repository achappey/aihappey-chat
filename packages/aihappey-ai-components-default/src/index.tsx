import React from "react";
import { defineCatalog } from "@json-render/core";
import {
  useAction,
  useActions,
  useBoundProp,
  type ComponentRenderProps,
  useStateStore,
  useStateBinding,
  useStateValue,
  useFieldValidation,
  useIsVisible,
  useValidation,
  schema,
} from "@json-render/react";
import { jsonSchemaToZod } from "json-schema-to-zod";
import { useTheme } from "aihappey-components";
import { useDarkMode } from "usehooks-ts";
import z from "zod";
import {
  ADAPTIVE_CARDS_CATALOG_ID,
  ADAPTIVE_CARDS_CATALOG_LABEL,
  adaptiveCardsAppComponentRegistry,
  adaptiveCardsCatalog,
  adaptiveCardsComponentRegistry,
  adaptiveCardsDefaultCatalogDefinitions,
} from "aihappey-ai-components-adaptive-cards";
import {
  OPENAPI_CATALOG_ID,
  OPENAPI_CATALOG_LABEL,
  openapiCatalog,
  openapiComponentRegistry,
  openapiDefaultCatalogDefinitions,
} from "aihappey-ai-components-openapi";
import { defaultComponentRegistry, getBuiltInMeta } from "./ComponentRegistry";
import { componentDefinitions } from "./componentDefinitions";

export { defaultComponentRegistry, getBuiltInMeta } from "./ComponentRegistry";
export { componentDefinitions } from "./componentDefinitions";

export type RuntimeActionItem = {
  registryId: string;
  name: string;
  paramsSchema?: string;
  description?: string;
  title?: string;
};

export type RuntimeCatalogDefinitions = {
  name: string;
  manageable?: boolean;
  components: Record<string, { props: z.ZodTypeAny; description?: string; slots?: string[] }>;
  actions: Record<string, { params: z.ZodTypeAny; description?: string }>;
  validationFunctions?: Record<string, { description?: string }>;
};

export type { ComponentRenderProps };

const emptySchema = { type: "object", properties: {} };
const emptyRegistry = {} as Record<string, never>;

export const BUILT_IN_REGISTRY_LABELS = {
  app: "Default",
  openapi: "OpenAPI",
  "adaptive-cards": "Adaptive Cards",
  "adaptive-cards-app": "Adaptive Cards App",
} as const;

export const BUILT_IN_CATALOG_LABELS = {
  app: "Default",
  [OPENAPI_CATALOG_ID]: OPENAPI_CATALOG_LABEL,
  [ADAPTIVE_CARDS_CATALOG_ID]: ADAPTIVE_CARDS_CATALOG_LABEL,
} as const;

const LEGACY_DEFAULT_CATALOG_TOKENS = new Set(["__default__", "built-in"]);
const ADAPTIVE_CARDS_APP_REGISTRY_ID = "adaptive-cards-app";

function toJsonSchemaString(maybeSchema: any) {
  const fallback = JSON.stringify(emptySchema);
  try {
    if (maybeSchema?.toJSONSchema) {
      return JSON.stringify(maybeSchema.toJSONSchema());
    }
  } catch {
    // ignore and fall through to zod v4 static conversion
  }
  try {
    const schema = (z as any)?.toJSONSchema?.(maybeSchema);
    return JSON.stringify(schema ?? emptySchema);
  } catch {
    return fallback;
  }
}

export function resolveBuiltInCatalogIds(catalogIds?: string[]): string[] {
  const requested = (catalogIds ?? []).filter(Boolean);
  if (requested.length === 0) {
    return ["app", OPENAPI_CATALOG_ID, ADAPTIVE_CARDS_CATALOG_ID];
  }

  const normalized = requested.flatMap((id) => {
    if (LEGACY_DEFAULT_CATALOG_TOKENS.has(id)) return ["app"];
    return [id];
  });

  return Array.from(new Set(normalized));
}

export const builtInRegistryItems = Object.keys(defaultComponentRegistry).map((name) => {
  const meta = getBuiltInMeta(name);
  return {
    id: `built-in:${name}`,
    registryId: "app",
    code: "",
    name,
    updatedAt: undefined,
    propsSchema: JSON.stringify(meta?.propsSchema ?? emptySchema),
  };
});

export const openapiBuiltInRegistryItems = Object.keys(openapiComponentRegistry).map((name) => ({
  id: `built-in:openapi:${name}`,
  registryId: OPENAPI_CATALOG_ID,
  code: "",
  name,
  updatedAt: undefined,
  propsSchema: toJsonSchemaString((openapiDefaultCatalogDefinitions as any)?.[0]?.components?.[name]?.props),
}));

export const adaptiveCardsBuiltInRegistryItems = Object.keys(adaptiveCardsComponentRegistry).map((name) => ({
  id: `built-in:adaptive-cards:${name}`,
  registryId: ADAPTIVE_CARDS_CATALOG_ID,
  code: "",
  name,
  updatedAt: undefined,
  propsSchema: toJsonSchemaString((adaptiveCardsDefaultCatalogDefinitions as any)?.[0]?.components?.[name]?.props),
}));

export const adaptiveCardsAppBuiltInRegistryItems = Object.keys(adaptiveCardsAppComponentRegistry).map((name) => ({
  id: `built-in:adaptive-cards-app:${name}`,
  registryId: ADAPTIVE_CARDS_APP_REGISTRY_ID,
  code: "",
  name,
  updatedAt: undefined,
  propsSchema: toJsonSchemaString((adaptiveCardsDefaultCatalogDefinitions as any)?.[0]?.components?.[name]?.props),
}));

export const defaultRegistryBundles = [
  {
    id: "app",
    registry: defaultComponentRegistry,
    items: builtInRegistryItems,
  },
  {
    id: ADAPTIVE_CARDS_CATALOG_ID,
    registry: adaptiveCardsComponentRegistry,
    items: adaptiveCardsBuiltInRegistryItems,
  },
  {
    id: ADAPTIVE_CARDS_APP_REGISTRY_ID,
    registry: adaptiveCardsAppComponentRegistry,
    items: adaptiveCardsAppBuiltInRegistryItems,
  },
  {
    id: OPENAPI_CATALOG_ID,
    registry: openapiComponentRegistry,
    items: openapiBuiltInRegistryItems,
  },

] as const;

export const defaultRegistryBundleIds = defaultRegistryBundles.map((bundle) => bundle.id);
export const staticActionDefinitions = {};

export const defaultCatalogDefinitions: RuntimeCatalogDefinitions[] = [
  {
    name: "app",
    manageable: false,
    components: componentDefinitions,
    actions: staticActionDefinitions,
    validationFunctions: {},
  },
];

export const builtInCatalogDefinitions: RuntimeCatalogDefinitions[] = [
  ...defaultCatalogDefinitions,
  ...(adaptiveCardsDefaultCatalogDefinitions as RuntimeCatalogDefinitions[]),
  ...(openapiDefaultCatalogDefinitions as RuntimeCatalogDefinitions[]),
];

export const defaultCatalog = defineCatalog(schema, {
  name: "Aihappey UI",
  components: componentDefinitions,
  actions: staticActionDefinitions,
});

export const builtInCatalogs = {
  app: defaultCatalog,
  [OPENAPI_CATALOG_ID]: openapiCatalog,
  [ADAPTIVE_CARDS_CATALOG_ID]: adaptiveCardsCatalog,
};

function parseParamsSchema(paramsSchema?: string) {
  if (typeof paramsSchema !== "string" || !paramsSchema.trim()) {
    return z.object({});
  }
  try {
    const jsonSchema = JSON.parse(paramsSchema);
    const zodSource = jsonSchemaToZod(jsonSchema);
    return new Function("z", `return (${zodSource});`)(z) as z.ZodTypeAny;
  } catch {
    return z.object({});
  }
}

export function buildDefaultCatalogWithActions(
  actionItems: RuntimeActionItem[],
  registryId = "app",
) {
  const runtimeActions = actionItems
    .filter((item) => item.registryId === registryId)
    .reduce<Record<string, { params: z.ZodTypeAny; description?: string }>>(
      (acc, item) => {
        acc[item.name] = {
          params: parseParamsSchema(item.paramsSchema),
          description: item.description ?? item.title,
        };
        return acc;
      },
      {},
    );

  return defineCatalog(schema, {
    name: "Aihappey UI",
    components: componentDefinitions,
    actions: {
      ...staticActionDefinitions,
      ...runtimeActions,
    },
  });
}

export function buildDefaultCatalogDefinitionsWithActions(
  actionItems: RuntimeActionItem[],
  registryId = "app",
  catalogIds?: string[],
): RuntimeCatalogDefinitions[] {
  const ids = resolveBuiltInCatalogIds(catalogIds);

  return builtInCatalogDefinitions
    .filter((item) => ids.includes(item.name))
    .map((item) => {
      if (item.name !== "app") return item;

      const catalog = buildDefaultCatalogWithActions(actionItems, registryId);
      return {
        name: "app",
        manageable: false,
        components: (catalog as any).data?.components ?? componentDefinitions,
        actions: (catalog as any).data?.actions ?? {},
        validationFunctions: {},
      };
    });
}

export const defaultRuntimeBindings = {
  React,
  useBoundProp,
  useStateBinding,
  useStateValue,
  useAction,
  useActions,
  useStateStore,
  useIsVisible,
  useFieldValidation,
  useValidation,
  useTheme,
  useDarkMode,
};
