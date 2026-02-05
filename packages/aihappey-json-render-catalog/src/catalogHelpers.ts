import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react";
import { jsonSchemaToZod } from "json-schema-to-zod";
import z from "zod";
import type {
  JsonRenderCatalogAction,
  JsonRenderCatalogComponent,
  JsonRenderCatalogItem,
  JsonRenderCatalogValidationFunction,
  RuntimeCatalogDefinitions,
} from "./types";

export type CatalogSelection = {
  selected: string[];
  includeAll: boolean;
};

export function parseCatalogList(value?: string): CatalogSelection {
  if (!value || !value.trim()) {
    return { selected: [], includeAll: true };
  }

  const tokens = value
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

  const includeAll = tokens.some((token) => token.toLowerCase() === "all");
  const selected = Array.from(
    new Set(tokens.filter((token) => token.toLowerCase() !== "all")),
  );

  return { selected, includeAll };
}

export function resolveCatalogSelection(
  value: string | undefined,
  available: string[],
  fallback: string[] = ["app"],
): string[] {
  const { includeAll, selected } = parseCatalogList(value);
  if (includeAll) {
    return available.length > 0 ? available : fallback;
  }

  const allowed = selected.filter((name) => available.includes(name));
  if (allowed.length > 0) {
    return Array.from(new Set(["app", ...allowed]));
  }
  return fallback;
}

export function parseJsonSchema(schema?: string): Record<string, unknown> {
  if (typeof schema !== "string" || !schema.trim()) {
    return {};
  }
  try {
    return JSON.parse(schema) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function compileZodFromJsonSchema(schema?: string): z.ZodTypeAny {
  if (typeof schema !== "string" || !schema.trim()) {
    return z.object({});
  }
  try {
    const jsonSchema = JSON.parse(schema);
    const zodSource = jsonSchemaToZod(jsonSchema);
    return new Function("z", `return (${zodSource});`)(z) as z.ZodTypeAny;
  } catch {
    return z.object({});
  }
}

function buildComponentDefs(
  components: JsonRenderCatalogComponent[],
): RuntimeCatalogDefinitions["components"] {
  return components.reduce<RuntimeCatalogDefinitions["components"]>(
    (acc, component) => {
      acc[component.name] = {
        props: compileZodFromJsonSchema(component.propsSchema),
        description: component.description,
        slots: component.hasChildren ? ["default"] : [],
      };
      return acc;
    },
    {},
  );
}

function buildActionDefs(
  actions: JsonRenderCatalogAction[],
): RuntimeCatalogDefinitions["actions"] {
  return actions.reduce<RuntimeCatalogDefinitions["actions"]>((acc, action) => {
    acc[action.name] = {
      params: compileZodFromJsonSchema(action.paramsSchema),
      description: action.description ?? action.title,
    };
    return acc;
  }, {});
}

function buildValidationDefs(
  functions: JsonRenderCatalogValidationFunction[],
): RuntimeCatalogDefinitions["validationFunctions"] {
  return functions.reduce<RuntimeCatalogDefinitions["validationFunctions"]>(
    (acc, fn) => {
      acc[fn.name] = { description: fn.description };
      return acc;
    },
    {},
  );
}

export function buildRuntimeCatalogDefinition(
  catalog: JsonRenderCatalogItem,
): RuntimeCatalogDefinitions {
  return {
    name: catalog.name,
    manageable: catalog.manageable,
    components: buildComponentDefs(catalog.components ?? []),
    actions: buildActionDefs(catalog.actions ?? []),
    validationFunctions: buildValidationDefs(catalog.validationFunctions ?? []),
  };
}

export function mergeRuntimeCatalogDefinitions(
  catalogs: RuntimeCatalogDefinitions[],
  name = "Combined Catalog",
): RuntimeCatalogDefinitions {
  return catalogs.reduce<RuntimeCatalogDefinitions>(
    (acc, catalog) => {
      acc.components = { ...acc.components, ...catalog.components };
      acc.actions = { ...acc.actions, ...catalog.actions };
      acc.validationFunctions = {
        ...acc.validationFunctions,
        ...catalog.validationFunctions,
      };
      acc.manageable = acc.manageable || catalog.manageable;
      acc.name = name;
      return acc;
    },
    {
      name,
      components: {},
      actions: {},
      validationFunctions: {},
    },
  );
}

export function createCatalogFromDefinitions(defs: RuntimeCatalogDefinitions) {
  return defineCatalog(schema, {
    name: defs.name,
    components: defs.components as any,
    actions: defs.actions as any,
    functions: defs.validationFunctions as any,
  });
}
