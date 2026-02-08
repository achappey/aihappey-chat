import type { Catalog as SchemaCatalog, SchemaDefinition } from "@json-render/core";
import type { JsonRenderActionItem } from "aihappey-json-render-registry";
import type {
  JsonRenderCatalogItem,
  RuntimeCatalogDefinitions,
} from "aihappey-json-render-catalog";
import {
  buildRuntimeCatalogDefinition,
  createCatalogFromDefinitions,
  mergeRuntimeCatalogDefinitions,
  resolveCatalogSelection,
} from "aihappey-json-render-catalog";
import {
  BUILT_IN_CATALOG_LABELS,
  buildDefaultCatalogDefinitionsWithActions as buildPackageDefaultCatalogDefinitionsWithActions,
  buildDefaultCatalogWithActions,
  builtInCatalogs,
  componentDefinitions,
  defaultCatalog,
  staticActionDefinitions,
} from "aihappey-ai-components-default";

export const catalog = defaultCatalog;
export const builtInCatalogById = builtInCatalogs;
export const builtInCatalogLabels = BUILT_IN_CATALOG_LABELS;

const LEGACY_DEFAULT_CATALOG_TOKENS = new Set(["__default__", "built-in"]);

export function mapLegacyDefaultCatalogSelection(catalogList?: string): string | undefined {
  const trimmed = String(catalogList ?? "").trim();
  if (!trimmed) return undefined;

  const tokens = trimmed
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

  const normalized: string[] = [];
  for (const token of tokens) {
    if (LEGACY_DEFAULT_CATALOG_TOKENS.has(token)) {
      normalized.push("app");
    } else {
      normalized.push(token);
    }
  }

  return Array.from(new Set(normalized)).join(",");
}

export function buildCatalogWithActions(
  actionItems: JsonRenderActionItem[],
  registryId = "app",
) {
  return buildDefaultCatalogWithActions(actionItems, registryId);
}

export function getDefaultCatalogDefinitionsWithActions(
  actionItems: JsonRenderActionItem[],
  registryId = "app",
  catalogIds?: string[],
): RuntimeCatalogDefinitions[] {
  return buildPackageDefaultCatalogDefinitionsWithActions(
    actionItems,
    registryId,
    catalogIds,
  ) as unknown as RuntimeCatalogDefinitions[];
}

export type RuntimeSchemaCatalog = SchemaCatalog<SchemaDefinition, {
  name?: string;
  components: typeof componentDefinitions;
  actions?: typeof staticActionDefinitions;
  functions?: Record<string, unknown>;
}>;

export function createCatalogFromStored(
  catalogs: JsonRenderCatalogItem[],
  catalogList: string | undefined,
  fallbackCatalogs?: RuntimeCatalogDefinitions | RuntimeCatalogDefinitions[],
) {
  const fallbackList = Array.isArray(fallbackCatalogs)
    ? fallbackCatalogs
    : fallbackCatalogs
      ? [fallbackCatalogs]
      : [];

  const fallbackNames = fallbackList.map((item) => item.name);
  const availableNames = Array.from(
    new Set([...catalogs.map((item) => item.name), ...fallbackNames]),
  );

  const selectedNames = resolveCatalogSelection(
    catalogList,
    availableNames,
    fallbackNames.length > 0 ? fallbackNames : ["app"],
  );

  const selectedStored = catalogs.filter((item) => selectedNames.includes(item.name));
  const selectedFallback = fallbackList.filter((item) => selectedNames.includes(item.name));

  const runtimeDefs = [
    ...selectedFallback,
    ...selectedStored.map(buildRuntimeCatalogDefinition),
  ];

  const merged = mergeRuntimeCatalogDefinitions(
    runtimeDefs,
    "Aihappey UI",
  );

  return createCatalogFromDefinitions(merged);
}

