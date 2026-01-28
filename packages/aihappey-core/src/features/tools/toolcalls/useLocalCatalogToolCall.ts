import { useCallback } from "react";
import type { Tool } from "@modelcontextprotocol/sdk/types";
import { useJsonRenderCatalog } from "aihappey-json-render-catalog";
import { jsonSchemaToZod } from "json-schema-to-zod";
import { z } from "zod";
import type {
  JsonRenderCatalogAction,
  JsonRenderCatalogComponent,
  JsonRenderCatalogItem,
  JsonRenderCatalogValidationFunction,
} from "aihappey-json-render-catalog";

/* ============================================================
   Result helpers
============================================================ */

type ToolTextResult = {
  isError: boolean;
  content: { type: "text"; text: string }[];
};

const ok = (text: string): ToolTextResult => ({
  isError: false,
  content: [{ type: "text", text }],
});

const fail = (err: unknown): ToolTextResult => ({
  isError: true,
  // Important: schema validation errors are returned as STRUCTURED JSON so the AI can self-correct.
  // Shape: { name, message, fieldPath, itemName?, cause? }
  content: [
    {
      type: "text",
      text:
        err instanceof CatalogSchemaValidationError
          ? JSON.stringify(err.toJSON())
          : err instanceof Error
            ? err.message
            : String(err),
    },
  ],
});

/* ============================================================
   Hard schema validation
   - We cannot store invalid schemas in the local catalog.
   - Validate by converting JSON Schema -> Zod source and compiling it.
 ============================================================ */

type CatalogSchemaValidationErrorPayload = {
  message: string;
  fieldPath: string;
  itemName?: string;
  cause?: string;
};

class CatalogSchemaValidationError extends Error {
  readonly fieldPath: string;
  readonly itemName?: string;
  readonly causeText?: string;

  constructor(payload: CatalogSchemaValidationErrorPayload) {
    super(payload.message);
    this.name = "CatalogSchemaValidationError";
    this.fieldPath = payload.fieldPath;
    this.itemName = payload.itemName;
    this.causeText = payload.cause;
  }

  toJSON(): CatalogSchemaValidationErrorPayload & { name: string } {
    return {
      name: this.name,
      message: this.message,
      fieldPath: this.fieldPath,
      itemName: this.itemName,
      cause: this.causeText,
    };
  }
}

function hardValidateJsonSchemaString(
  schemaString: string,
  ctx: { fieldPath: string; itemName?: string },
): void {
  const trimmed = typeof schemaString === "string" ? schemaString.trim() : "";
  if (!trimmed) {
    throw new CatalogSchemaValidationError({
      message: `Schema must be a non-empty JSON Schema string.`,
      fieldPath: ctx.fieldPath,
      itemName: ctx.itemName,
      cause: "Empty string",
    });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (e) {
    throw new CatalogSchemaValidationError({
      message: `Invalid JSON in schema at ${ctx.fieldPath}.`,
      fieldPath: ctx.fieldPath,
      itemName: ctx.itemName,
      cause: e instanceof Error ? e.message : String(e),
    });
  }

  if (parsed == null || (typeof parsed !== "object" && typeof parsed !== "boolean")) {
    // JSON Schema can technically be boolean, but disallow primitives other than boolean.
    throw new CatalogSchemaValidationError({
      message: `Schema at ${ctx.fieldPath} must be a JSON object (or boolean) JSON Schema.`,
      fieldPath: ctx.fieldPath,
      itemName: ctx.itemName,
      cause: `Got ${typeof parsed}`,
    });
  }

  let zodSource: string;
  try {
    zodSource = jsonSchemaToZod(parsed as any);
  } catch (e) {
    throw new CatalogSchemaValidationError({
      message: `Failed to convert JSON Schema to Zod at ${ctx.fieldPath}.`,
      fieldPath: ctx.fieldPath,
      itemName: ctx.itemName,
      cause: e instanceof Error ? e.message : String(e),
    });
  }

  try {
    // Validate that the generated Zod expression compiles.
    // eslint-disable-next-line no-new-func
    const compiled = new Function("z", `return (${zodSource});`)(z) as any;

    // HARDENING:
    // Some JSON Schema -> Zod conversions can compile but still produce an invalid Zod shape
    // (eg object properties with `undefined` schemas). That only surfaces later when
    // the app calls `toJSONSchema()` (runtime crash: reading '_zod' of undefined).
    // If available, call it here to ensure it won't crash later.
    if (compiled && typeof compiled.toJSONSchema === "function") {
      try {
        compiled.toJSONSchema();
      } catch (e) {
        throw new CatalogSchemaValidationError({
          message: `Schema at ${ctx.fieldPath} compiles but fails to convert back to JSON Schema (toJSONSchema crashed).`,
          fieldPath: ctx.fieldPath,
          itemName: ctx.itemName,
          cause: e instanceof Error ? e.message : String(e),
        });
      }
    }
  } catch (e) {
    if (e instanceof CatalogSchemaValidationError) throw e;
    throw new CatalogSchemaValidationError({
      message: `Generated Zod schema failed to compile at ${ctx.fieldPath}.`,
      fieldPath: ctx.fieldPath,
      itemName: ctx.itemName,
      cause: e instanceof Error ? e.message : String(e),
    });
  }
}

/* ============================================================
   Tool definitions (STATIC)
============================================================ */

export const localCatalogListTool: Tool = {
  name: "local_catalog_list",
  title: "List local UI catalogs",
  description: "List all locally stored json-render catalogs.",
  inputSchema: { type: "object", properties: {} },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};

export const localCatalogReadTool: Tool = {
  name: "local_catalog_read",
  title: "Read local UI catalog",
  description: "Read a locally stored json-render catalog by id.",
  inputSchema: {
    type: "object",
    properties: {
      catalogId: { type: "string", description: "Catalog id" },
    },
    required: ["catalogId"],
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};

export const localCatalogCreateTool: Tool = {
  name: "local_catalog_create",
  title: "Create local UI catalog",
  description:
    "Create a new locally stored json-render catalog, optionally including components/actions/validationFunctions.",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Catalog name" },
      manageable: { type: "boolean", description: "Whether catalog is user-manageable" },
      components: {
        type: "array",
        description: "Optional list of catalog components",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            propsSchema: { type: ["string", "object"], description: "JSON Schema (string or object)" },
            description: { type: "string" },
            hasChildren: { type: "boolean" },
          },
          required: ["name", "propsSchema"],
        },
      },
      actions: {
        type: "array",
        description: "Optional list of catalog actions",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            paramsSchema: { type: ["string", "object"], description: "JSON Schema (string or object)" },
            title: { type: "string" },
            description: { type: "string" },
          },
          required: ["name"],
        },
      },
      validationFunctions: {
        type: "array",
        description: "Optional list of catalog validation functions",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
          },
          required: ["name"],
        },
      },
    },
    required: ["name"],
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
  },
};

export const localCatalogUpdateTool: Tool = {
  name: "local_catalog_update",
  title: "Update local UI catalog",
  description:
    "Update an existing local json-render catalog by id. Provided fields overwrite; omitted fields stay unchanged.",
  inputSchema: {
    type: "object",
    properties: {
      catalogId: { type: "string", description: "Catalog id" },
      name: { type: "string", description: "Catalog name" },
      manageable: { type: "boolean", description: "Whether catalog is user-manageable" },
      components: {
        type: "array",
        description: "If provided, replaces the entire components array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            propsSchema: { type: ["string", "object"], description: "JSON Schema (string or object)" },
            description: { type: "string" },
            hasChildren: { type: "boolean" },
          },
          required: ["name", "propsSchema"],
        },
      },
      actions: {
        type: "array",
        description: "If provided, replaces the entire actions array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            paramsSchema: { type: ["string", "object"], description: "JSON Schema (string or object)" },
            title: { type: "string" },
            description: { type: "string" },
          },
          required: ["name"],
        },
      },
      validationFunctions: {
        type: "array",
        description: "If provided, replaces the entire validationFunctions array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
          },
          required: ["name"],
        },
      },
    },
    required: ["catalogId"],
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
  },
};

export const localCatalogDeleteTool: Tool = {
  name: "local_catalog_delete",
  title: "Delete local UI catalog",
  description: "Delete a local json-render catalog by id.",
  inputSchema: {
    type: "object",
    properties: {
      catalogId: { type: "string", description: "Catalog id" },
    },
    required: ["catalogId"],
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: false,
  },
};

export const localCatalogComponentAddTool: Tool = {
  name: "local_catalog_component_add",
  title: "Add catalog component",
  description: "Add a component definition to a local json-render catalog.",
  inputSchema: {
    type: "object",
    properties: {
      catalogId: { type: "string" },
      component: {
        type: "object",
        properties: {
          name: { type: "string" },
          propsSchema: { type: ["string", "object"], description: "JSON Schema (string or object)" },
          description: { type: "string" },
          hasChildren: { type: "boolean" },
        },
        required: ["name", "propsSchema"],
      },
    },
    required: ["catalogId", "component"],
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
};

export const localCatalogComponentUpdateTool: Tool = {
  name: "local_catalog_component_update",
  title: "Update catalog component",
  description: "Update a component definition in a local json-render catalog by component name.",
  inputSchema: {
    type: "object",
    properties: {
      catalogId: { type: "string" },
      componentName: { type: "string", description: "Existing component name" },
      patch: {
        type: "object",
        properties: {
          name: { type: "string", description: "New name (optional rename)" },
          propsSchema: { type: ["string", "object"], description: "JSON Schema (string or object)" },
          description: { type: "string" },
          hasChildren: { type: "boolean" },
        },
      },
    },
    required: ["catalogId", "componentName", "patch"],
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
};

export const localCatalogComponentDeleteTool: Tool = {
  name: "local_catalog_component_delete",
  title: "Delete catalog component",
  description: "Delete a component definition from a local json-render catalog.",
  inputSchema: {
    type: "object",
    properties: {
      catalogId: { type: "string" },
      componentName: { type: "string" },
    },
    required: ["catalogId", "componentName"],
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
};

export const localCatalogActionAddTool: Tool = {
  name: "local_catalog_action_add",
  title: "Add catalog action",
  description: "Add an action definition to a local json-render catalog.",
  inputSchema: {
    type: "object",
    properties: {
      catalogId: { type: "string" },
      action: {
        type: "object",
        properties: {
          name: { type: "string" },
          paramsSchema: { type: ["string", "object"], description: "JSON Schema (string or object)" },
          title: { type: "string" },
          description: { type: "string" },
        },
        required: ["name"],
      },
    },
    required: ["catalogId", "action"],
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
};

export const localCatalogActionUpdateTool: Tool = {
  name: "local_catalog_action_update",
  title: "Update catalog action",
  description: "Update an action definition in a local json-render catalog by action name.",
  inputSchema: {
    type: "object",
    properties: {
      catalogId: { type: "string" },
      actionName: { type: "string", description: "Existing action name" },
      patch: {
        type: "object",
        properties: {
          name: { type: "string", description: "New name (optional rename)" },
          paramsSchema: { type: ["string", "object"], description: "JSON Schema (string or object)" },
          title: { type: "string" },
          description: { type: "string" },
        },
      },
    },
    required: ["catalogId", "actionName", "patch"],
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
};

export const localCatalogActionDeleteTool: Tool = {
  name: "local_catalog_action_delete",
  title: "Delete catalog action",
  description: "Delete an action definition from a local json-render catalog.",
  inputSchema: {
    type: "object",
    properties: {
      catalogId: { type: "string" },
      actionName: { type: "string" },
    },
    required: ["catalogId", "actionName"],
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
};

export const localCatalogValidationAddTool: Tool = {
  name: "local_catalog_validation_add",
  title: "Add catalog validation function",
  description: "Add a validation function reference to a local json-render catalog.",
  inputSchema: {
    type: "object",
    properties: {
      catalogId: { type: "string" },
      validation: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
        },
        required: ["name"],
      },
    },
    required: ["catalogId", "validation"],
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
};

export const localCatalogValidationUpdateTool: Tool = {
  name: "local_catalog_validation_update",
  title: "Update catalog validation function",
  description: "Update a validation function reference in a local json-render catalog by name.",
  inputSchema: {
    type: "object",
    properties: {
      catalogId: { type: "string" },
      validationName: { type: "string", description: "Existing validation function name" },
      patch: {
        type: "object",
        properties: {
          name: { type: "string", description: "New name (optional rename)" },
          description: { type: "string" },
        },
      },
    },
    required: ["catalogId", "validationName", "patch"],
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
};

export const localCatalogValidationDeleteTool: Tool = {
  name: "local_catalog_validation_delete",
  title: "Delete catalog validation function",
  description: "Delete a validation function reference from a local json-render catalog.",
  inputSchema: {
    type: "object",
    properties: {
      catalogId: { type: "string" },
      validationName: { type: "string" },
    },
    required: ["catalogId", "validationName"],
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
};

/* ============================================================
   Plugin DEFINITION (STATIC)
============================================================ */

export const localCatalogPluginDef = {
  name: "local-catalog",
  match: (toolName: string) => toolName.startsWith("local_catalog_"),
  tools: [
    localCatalogListTool,
    localCatalogReadTool,
    localCatalogCreateTool,
    localCatalogUpdateTool,
    localCatalogDeleteTool,
    localCatalogComponentAddTool,
    localCatalogComponentUpdateTool,
    localCatalogComponentDeleteTool,
    localCatalogActionAddTool,
    localCatalogActionUpdateTool,
    localCatalogActionDeleteTool,
    localCatalogValidationAddTool,
    localCatalogValidationUpdateTool,
    localCatalogValidationDeleteTool,
  ],
};

type LocalCatalogToolName =
  | "local_catalog_list"
  | "local_catalog_read"
  | "local_catalog_create"
  | "local_catalog_update"
  | "local_catalog_delete"
  | "local_catalog_component_add"
  | "local_catalog_component_update"
  | "local_catalog_component_delete"
  | "local_catalog_action_add"
  | "local_catalog_action_update"
  | "local_catalog_action_delete"
  | "local_catalog_validation_add"
  | "local_catalog_validation_update"
  | "local_catalog_validation_delete";

type LocalCatalogToolCall = {
  toolName: LocalCatalogToolName;
  input?: any;
};

/* ============================================================
   Runtime helpers
============================================================ */

function ensureJsonString(schema: unknown): string {
  if (schema == null) return "";
  if (typeof schema === "string") return schema;
  try {
    return JSON.stringify(schema);
  } catch {
    return String(schema);
  }
}

function normalizeComponent(input: any): JsonRenderCatalogComponent {
  const name = String(input?.name ?? "").trim();
  if (!name) throw new Error("Component name is required.");
  const propsSchema = ensureJsonString(input?.propsSchema);
  if (!propsSchema.trim()) {
    throw new CatalogSchemaValidationError({
      message: "Component propsSchema is required and cannot be empty.",
      fieldPath: `components[name=${name}].propsSchema`,
      itemName: name,
      cause: "Empty string",
    });
  }

  hardValidateJsonSchemaString(propsSchema, {
    fieldPath: `components[name=${name}].propsSchema`,
    itemName: name,
  });

  return {
    name,
    propsSchema,
    description: input?.description,
    hasChildren: input?.hasChildren,
  };
}

function normalizeAction(input: any): JsonRenderCatalogAction {
  const name = String(input?.name ?? "").trim();
  if (!name) throw new Error("Action name is required.");

  const hasParamsSchema = input?.paramsSchema != null;
  const paramsSchema = hasParamsSchema ? ensureJsonString(input.paramsSchema) : undefined;
  if (hasParamsSchema && !paramsSchema?.trim()) {
    throw new CatalogSchemaValidationError({
      message: "Action paramsSchema cannot be empty when provided.",
      fieldPath: `actions[name=${name}].paramsSchema`,
      itemName: name,
      cause: "Empty string",
    });
  }
  if (paramsSchema != null) {
    hardValidateJsonSchemaString(paramsSchema, {
      fieldPath: `actions[name=${name}].paramsSchema`,
      itemName: name,
    });
  }

  return {
    name,
    paramsSchema,
    title: input?.title,
    description: input?.description,
  };
}

function normalizeValidation(input: any): JsonRenderCatalogValidationFunction {
  const name = String(input?.name ?? "").trim();
  if (!name) throw new Error("Validation function name is required.");
  return {
    name,
    description: input?.description,
  };
}

function toUpsertPayload(catalog: JsonRenderCatalogItem) {
  return {
    name: catalog.name,
    manageable: catalog.manageable,
    components: catalog.components ?? [],
    actions: catalog.actions ?? [],
    validationFunctions: catalog.validationFunctions ?? [],
  };
}

const spreadIf = (cond: any, obj: Record<string, any>) => (cond ? obj : {});

/* ============================================================
   Plugin RUNTIME (execution only)
============================================================ */

export function useLocalCatalogRuntime() {
  const catalogs = useJsonRenderCatalog();

  const handle = useCallback(
    async (toolCall: LocalCatalogToolCall): Promise<ToolTextResult> => {
      try {
        const input = toolCall.input ?? {};

        switch (toolCall.toolName) {
          case "local_catalog_list": {
            return ok(JSON.stringify(catalogs.items ?? []));
          }

          case "local_catalog_read": {
            const catalogId = String(input.catalogId ?? "").trim();
            if (!catalogId) throw new Error("Missing catalogId.");
            const item = await catalogs.read(catalogId);
            if (!item) throw new Error("Catalog not found.");
            return ok(JSON.stringify(item));
          }

          case "local_catalog_create": {
            const name = String(input.name ?? "").trim();
            if (!name) throw new Error("Missing name.");

            const manageable =
              typeof input.manageable === "boolean" ? input.manageable : true;

            const components = Array.isArray(input.components)
              ? input.components.map(normalizeComponent)
              : [];
            const actions = Array.isArray(input.actions)
              ? input.actions.map(normalizeAction)
              : [];
            const validationFunctions = Array.isArray(input.validationFunctions)
              ? input.validationFunctions.map(normalizeValidation)
              : [];

            const created = await catalogs.create({
              name,
              manageable,
              components,
              actions,
              validationFunctions,
            });

            return ok(JSON.stringify(created));
          }

          case "local_catalog_update": {
            const catalogId = String(input.catalogId ?? "").trim();
            if (!catalogId) throw new Error("Missing catalogId.");
            const existing = await catalogs.read(catalogId);
            if (!existing) throw new Error("Catalog not found.");

            const next = {
              ...toUpsertPayload(existing),
              ...spreadIf(input.name != null, { name: String(input.name).trim() }),
              ...spreadIf(typeof input.manageable === "boolean", {
                manageable: input.manageable,
              }),
              ...spreadIf(Array.isArray(input.components), {
                components: input.components.map(normalizeComponent),
              }),
              ...spreadIf(Array.isArray(input.actions), {
                actions: input.actions.map(normalizeAction),
              }),
              ...spreadIf(Array.isArray(input.validationFunctions), {
                validationFunctions: input.validationFunctions.map(normalizeValidation),
              }),
            };

            if (!next.name?.trim()) throw new Error("Catalog name cannot be empty.");

            const updated = await catalogs.update(catalogId, next);
            return ok(JSON.stringify(updated));
          }

          case "local_catalog_delete": {
            const catalogId = String(input.catalogId ?? "").trim();
            if (!catalogId) throw new Error("Missing catalogId.");
            await catalogs.delete(catalogId);
            return ok("OK");
          }

          case "local_catalog_component_add": {
            const catalogId = String(input.catalogId ?? "").trim();
            if (!catalogId) throw new Error("Missing catalogId.");
            const existing = await catalogs.read(catalogId);
            if (!existing) throw new Error("Catalog not found.");
            const component = normalizeComponent(input.component);

            if ((existing.components ?? []).some((c) => c.name === component.name)) {
              throw new Error(`Component already exists: ${component.name}`);
            }

            const updated = await catalogs.update(catalogId, {
              ...toUpsertPayload(existing),
              components: [component, ...(existing.components ?? [])],
            });
            return ok(JSON.stringify(updated));
          }

          case "local_catalog_component_update": {
            const catalogId = String(input.catalogId ?? "").trim();
            const componentName = String(input.componentName ?? "").trim();
            if (!catalogId) throw new Error("Missing catalogId.");
            if (!componentName) throw new Error("Missing componentName.");
            const existing = await catalogs.read(catalogId);
            if (!existing) throw new Error("Catalog not found.");

            const comps = existing.components ?? [];
            const idx = comps.findIndex((c) => c.name === componentName);
            if (idx < 0) throw new Error(`Component not found: ${componentName}`);

            const current = comps[idx];
            const patch = input.patch ?? {};
            const nextName = patch?.name != null ? String(patch.name).trim() : current.name;
            if (!nextName) throw new Error("Component name cannot be empty.");

            if (
              nextName !== current.name &&
              comps.some((c) => c.name === nextName)
            ) {
              throw new Error(`Component already exists: ${nextName}`);
            }

            const next: JsonRenderCatalogComponent = {
              ...current,
              name: nextName,
              ...spreadIf(patch.propsSchema != null, {
                propsSchema: ensureJsonString(patch.propsSchema),
              }),
              ...spreadIf(patch.description != null, { description: patch.description }),
              ...spreadIf(patch.hasChildren != null, { hasChildren: !!patch.hasChildren }),
            };

            if (!next.propsSchema?.trim()) {
              throw new CatalogSchemaValidationError({
                message: "Component propsSchema cannot be empty when provided.",
                fieldPath: `components[name=${next.name}].propsSchema`,
                itemName: next.name,
                cause: "Empty string",
              });
            }

            // Hard schema validation (compile JSON Schema -> Zod)
            hardValidateJsonSchemaString(next.propsSchema, {
              fieldPath: `components[name=${next.name}].propsSchema`,
              itemName: next.name,
            });

            const updated = await catalogs.update(catalogId, {
              ...toUpsertPayload(existing),
              components: comps.map((c, i) => (i === idx ? next : c)),
            });
            return ok(JSON.stringify(updated));
          }

          case "local_catalog_component_delete": {
            const catalogId = String(input.catalogId ?? "").trim();
            const componentName = String(input.componentName ?? "").trim();
            if (!catalogId) throw new Error("Missing catalogId.");
            if (!componentName) throw new Error("Missing componentName.");
            const existing = await catalogs.read(catalogId);
            if (!existing) throw new Error("Catalog not found.");

            const updated = await catalogs.update(catalogId, {
              ...toUpsertPayload(existing),
              components: (existing.components ?? []).filter((c) => c.name !== componentName),
            });
            return ok(JSON.stringify(updated));
          }

          case "local_catalog_action_add": {
            const catalogId = String(input.catalogId ?? "").trim();
            if (!catalogId) throw new Error("Missing catalogId.");
            const existing = await catalogs.read(catalogId);
            if (!existing) throw new Error("Catalog not found.");
            const action = normalizeAction(input.action);

            if ((existing.actions ?? []).some((a) => a.name === action.name)) {
              throw new Error(`Action already exists: ${action.name}`);
            }

            const updated = await catalogs.update(catalogId, {
              ...toUpsertPayload(existing),
              actions: [action, ...(existing.actions ?? [])],
            });
            return ok(JSON.stringify(updated));
          }

          case "local_catalog_action_update": {
            const catalogId = String(input.catalogId ?? "").trim();
            const actionName = String(input.actionName ?? "").trim();
            if (!catalogId) throw new Error("Missing catalogId.");
            if (!actionName) throw new Error("Missing actionName.");
            const existing = await catalogs.read(catalogId);
            if (!existing) throw new Error("Catalog not found.");

            const actions = existing.actions ?? [];
            const idx = actions.findIndex((a) => a.name === actionName);
            if (idx < 0) throw new Error(`Action not found: ${actionName}`);

            const current = actions[idx];
            const patch = input.patch ?? {};
            const nextName = patch?.name != null ? String(patch.name).trim() : current.name;
            if (!nextName) throw new Error("Action name cannot be empty.");

            if (nextName !== current.name && actions.some((a) => a.name === nextName)) {
              throw new Error(`Action already exists: ${nextName}`);
            }

            const next: JsonRenderCatalogAction = {
              ...current,
              name: nextName,
              ...spreadIf(patch.paramsSchema != null, {
                paramsSchema: ensureJsonString(patch.paramsSchema),
              }),
              ...spreadIf(patch.title != null, { title: patch.title }),
              ...spreadIf(patch.description != null, { description: patch.description }),
            };

            if (patch.paramsSchema != null && !next.paramsSchema?.trim()) {
              throw new CatalogSchemaValidationError({
                message: "Action paramsSchema cannot be empty when provided.",
                fieldPath: `actions[name=${next.name}].paramsSchema`,
                itemName: next.name,
                cause: "Empty string",
              });
            }

            if (next.paramsSchema != null) {
              // Hard schema validation (compile JSON Schema -> Zod)
              hardValidateJsonSchemaString(next.paramsSchema, {
                fieldPath: `actions[name=${next.name}].paramsSchema`,
                itemName: next.name,
              });
            }

            const updated = await catalogs.update(catalogId, {
              ...toUpsertPayload(existing),
              actions: actions.map((a, i) => (i === idx ? next : a)),
            });
            return ok(JSON.stringify(updated));
          }

          case "local_catalog_action_delete": {
            const catalogId = String(input.catalogId ?? "").trim();
            const actionName = String(input.actionName ?? "").trim();
            if (!catalogId) throw new Error("Missing catalogId.");
            if (!actionName) throw new Error("Missing actionName.");
            const existing = await catalogs.read(catalogId);
            if (!existing) throw new Error("Catalog not found.");

            const updated = await catalogs.update(catalogId, {
              ...toUpsertPayload(existing),
              actions: (existing.actions ?? []).filter((a) => a.name !== actionName),
            });
            return ok(JSON.stringify(updated));
          }

          case "local_catalog_validation_add": {
            const catalogId = String(input.catalogId ?? "").trim();
            if (!catalogId) throw new Error("Missing catalogId.");
            const existing = await catalogs.read(catalogId);
            if (!existing) throw new Error("Catalog not found.");
            const validation = normalizeValidation(input.validation);

            if (
              (existing.validationFunctions ?? []).some(
                (v) => v.name === validation.name,
              )
            ) {
              throw new Error(`Validation function already exists: ${validation.name}`);
            }

            const updated = await catalogs.update(catalogId, {
              ...toUpsertPayload(existing),
              validationFunctions: [validation, ...(existing.validationFunctions ?? [])],
            });
            return ok(JSON.stringify(updated));
          }

          case "local_catalog_validation_update": {
            const catalogId = String(input.catalogId ?? "").trim();
            const validationName = String(input.validationName ?? "").trim();
            if (!catalogId) throw new Error("Missing catalogId.");
            if (!validationName) throw new Error("Missing validationName.");
            const existing = await catalogs.read(catalogId);
            if (!existing) throw new Error("Catalog not found.");

            const vals = existing.validationFunctions ?? [];
            const idx = vals.findIndex((v) => v.name === validationName);
            if (idx < 0) throw new Error(`Validation function not found: ${validationName}`);

            const current = vals[idx];
            const patch = input.patch ?? {};
            const nextName = patch?.name != null ? String(patch.name).trim() : current.name;
            if (!nextName) throw new Error("Validation function name cannot be empty.");

            if (nextName !== current.name && vals.some((v) => v.name === nextName)) {
              throw new Error(`Validation function already exists: ${nextName}`);
            }

            const next: JsonRenderCatalogValidationFunction = {
              ...current,
              name: nextName,
              ...spreadIf(patch.description != null, { description: patch.description }),
            };

            const updated = await catalogs.update(catalogId, {
              ...toUpsertPayload(existing),
              validationFunctions: vals.map((v, i) => (i === idx ? next : v)),
            });
            return ok(JSON.stringify(updated));
          }

          case "local_catalog_validation_delete": {
            const catalogId = String(input.catalogId ?? "").trim();
            const validationName = String(input.validationName ?? "").trim();
            if (!catalogId) throw new Error("Missing catalogId.");
            if (!validationName) throw new Error("Missing validationName.");
            const existing = await catalogs.read(catalogId);
            if (!existing) throw new Error("Catalog not found.");

            const updated = await catalogs.update(catalogId, {
              ...toUpsertPayload(existing),
              validationFunctions: (existing.validationFunctions ?? []).filter(
                (v) => v.name !== validationName,
              ),
            });
            return ok(JSON.stringify(updated));
          }

          default:
            throw new Error(`Unsupported tool: ${toolCall.toolName}`);
        }
      } catch (e) {
        return fail(e);
      }
    },
    [catalogs],
  );

  return { name: localCatalogPluginDef.name, handle };
}

/* ============================================================
   Notes for AI tool callers

   On schema failures, tool calls return `isError: true` and `content[0].text`
   containing JSON like:

   {
     "name": "CatalogSchemaValidationError",
     "message": "Failed to convert JSON Schema to Zod at actions[name=foo].paramsSchema.",
     "fieldPath": "actions[name=foo].paramsSchema",
     "itemName": "foo",
     "cause": "<original parse/compile error>"
   }

   Use `fieldPath` + `cause` to correct the schema and retry.
 ============================================================ */

