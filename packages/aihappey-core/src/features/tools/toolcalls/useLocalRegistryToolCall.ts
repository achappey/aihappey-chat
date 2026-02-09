import React, { useCallback } from "react";
import type { Tool } from "@modelcontextprotocol/sdk/types";
import {
  compileRuntimeComponent,
  useJsonRenderRegistry,
  validateComponentCode,
} from "aihappey-json-render-registry";
import {
  useAction,
  useActions,
  useStateStore,
  useStateBinding,
  useStateValue,
  useFieldValidation,
  useIsVisible,
  useValidation,
} from "@json-render/react";
import { useTheme } from "aihappey-components";
import { useDarkMode } from "usehooks-ts";
import { componentRegistry } from "../../json-render/ComponentRegistry";

const BUILT_IN_COMPONENT_NAMES = new Set(Object.keys(componentRegistry));

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

const CODE_TEMPLATE = `(
  props,
  ctx,
) => React.createElement(
  "div",
  null,
  "Hello from runtime component",
)`;

function formatToolError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  const isValidationError =
    message.includes("Forbidden token:") ||
    message.includes("Runtime component code must return a function.");

  if (!isValidationError) return message;

  return (
    message +
    "\n\n" +
    "Component code rules:\n" +
    "- code MUST be a single JS expression that evaluates to a function (e.g. an arrow function).\n" +
    "- NO JSX, NO import/export/require.\n" +
    "- Only use runtime bindings passed via ctx (React, useStateBinding, useStateValue, etc).\n" +
    "- Theme helpers are available: useTheme() (from aihappey-components) and useDarkMode() (from usehooks-ts; returns { isDarkMode }).\n\n" +
    "Minimal valid example:\n" +
    CODE_TEMPLATE
  );
}

const fail = (err: unknown): ToolTextResult => ({
  isError: true,
  content: [{ type: "text", text: formatToolError(err) }],
});

/* ============================================================
   Tool definitions (STATIC)
============================================================ */

export const localRegistryComponentListTool: Tool = {
  name: "local_registry_component_list",
  title: "List local registry components",
  description:
    "List all locally stored json-render registry components. Optionally filter by registryId.",
  inputSchema: {
    type: "object",
    properties: {
      registryId: { type: "string", description: "Optional registry id filter (e.g. app)" },
    },
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};

export const localRegistryComponentValidateTool: Tool = {
  name: "local_registry_component_validate",
  title: "Validate registry component code",
  description:
    "Validate runtime component code. Checks forbidden tokens/patterns (e.g. Function/import/export/window) AND that the code evaluates to a function when compiled with runtime bindings. Does not create/update anything.",
  inputSchema: {
    type: "object",
    properties: {
      code: {
        type: "string",
        description:
          "A single JS expression that evaluates to a function. IMPORTANT: no JSX, no import/export. Example: (props, ctx) => React.createElement('div', null, 'hi')",
      },
    },
    required: ["code"],
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};

export const localRegistryComponentCreateTool: Tool = {
  name: "local_registry_component_create",
  title: "Create registry component",
  description:
    "Create a new registry component in the local json-render registry. Runtime bindings available in code include React + json-render hooks, plus theme helpers useTheme() (aihappey-components) and useDarkMode() (usehooks-ts; returns { isDarkMode }). IMPORTANT: writes to registryId=\"app\" are blocked for custom components; use a non-default registryId (e.g. \"custom\"). HARD VALIDATION is performed: forbidden tokens are rejected and code must evaluate to a function.",
  inputSchema: {
    type: "object",
    properties: {
      registryId: {
        type: "string",
        description:
          "Registry id. For custom components you MUST use a non-default id (e.g. 'custom'); registryId='app' is only allowed for built-in component names.",
      },
      componentName: {
        type: "string",
        description: "Component name (PascalCase).",
      },
      code: {
        type: "string",
        description:
          "A single JS expression that evaluates to a function. NO JSX. NO import/export/require. Use React.createElement. Signature: (props, ctx) => React.createElement(...)",
      },
      propsSchema: { type: ["string", "object"], description: "JSON Schema (string or object)" },
    },
    required: ["registryId", "componentName", "code"],
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
  },
};

export const localRegistryComponentUpdateTool: Tool = {
  name: "local_registry_component_update",
  title: "Update registry component",
  description:
    "Update an existing registry component. Provide id OR registryId+componentName to locate it. Runtime bindings available in code include React + json-render hooks, plus theme helpers useTheme() (aihappey-components) and useDarkMode() (usehooks-ts; returns { isDarkMode }). IMPORTANT: writes to registryId=\"app\" are blocked for custom components; use a non-default registryId (e.g. \"custom\"). HARD VALIDATION is performed: forbidden tokens are rejected and code must evaluate to a function.",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "string", description: "Existing component id (optional)" },
      registryId: {
        type: "string",
        description:
          "Registry id. For custom components you MUST use a non-default id (e.g. 'custom'); registryId='app' is only allowed for built-in component names.",
      },
      componentName: { type: "string", description: "Component name (PascalCase)." },
      code: {
        type: "string",
        description:
          "A single JS expression that evaluates to a function. NO JSX. NO import/export/require. Use React.createElement. Signature: (props, ctx) => React.createElement(...)",
      },
      propsSchema: { type: ["string", "object"], description: "JSON Schema (string or object)" },
    },
    required: ["registryId", "componentName", "code"],
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
  },
};

export const localRegistryComponentDeleteTool: Tool = {
  name: "local_registry_component_delete",
  title: "Delete registry component",
  description:
    "Delete an existing registry component. Provide id OR registryId+componentName to locate it.",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "string", description: "Existing component id (optional)" },
      registryId: { type: "string", description: "Registry id (e.g. app)" },
      componentName: { type: "string", description: "Component name" },
    },
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: false,
  },
};

/* ============================================================
   Plugin DEFINITION (STATIC)
============================================================ */

export const localRegistryPluginDef = {
  name: "local-registry",
  match: (toolName: string) => toolName.startsWith("local_registry_"),
  tools: [
    localRegistryComponentListTool,
    localRegistryComponentValidateTool,
    localRegistryComponentCreateTool,
    localRegistryComponentUpdateTool,
    localRegistryComponentDeleteTool,
  ],
};

type LocalRegistryToolName =
  | "local_registry_component_list"
  | "local_registry_component_validate"
  | "local_registry_component_create"
  | "local_registry_component_update"
  | "local_registry_component_delete";

type LocalRegistryToolCall = {
  toolName: LocalRegistryToolName;
  input?: any;
};

function ensureJsonString(schema: unknown): string | undefined {
  if (schema == null) return undefined;
  if (typeof schema === "string") return schema;
  try {
    return JSON.stringify(schema);
  } catch {
    return String(schema);
  }
}

/* ============================================================
   Plugin RUNTIME (execution only)
============================================================ */

export function useLocalRegistryRuntime() {
  const registry = useJsonRenderRegistry();

  const validationRuntime = {
    React,
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

  const assertCanWriteToRegistry = (registryId: string, componentName: string) => {
    // Hard safety guard: prevent AI from dumping new custom components into the default `app` registry.
    // Only allow modifications in `app` if the component name is a built-in/default component.
    if (registryId === "app" && !BUILT_IN_COMPONENT_NAMES.has(componentName)) {
      throw new Error(
        `Refusing to write custom component "${componentName}" into the default registryId "app". ` +
          `Use a non-default registryId (e.g. "custom") or use a built-in component name.`,
      );
    }
  };

  const assertValidComponentCode = (componentName: string, code: string) => {
    const result = validateComponentCode(code);
    if (!result.ok) {
      throw new Error(result.errors.join("; "));
    }

    // Hard validation: mirror the runtime compiler expectation that the provided `code`
    // evaluates to a function when executed in a sandbox with runtime bindings.
    // This prevents persisting components that will later fail in preview.
    compileRuntimeComponent(code, validationRuntime as any, { name: componentName });
  };

  const handle = useCallback(
    async (toolCall: LocalRegistryToolCall): Promise<ToolTextResult> => {
      try {
        const input = toolCall.input ?? {};
        switch (toolCall.toolName) {
          case "local_registry_component_list": {
            const registryId = input.registryId ? String(input.registryId).trim() : "";
            const items = Array.isArray(registry.items) ? registry.items : [];
            const out = registryId ? items.filter((i) => i.registryId === registryId) : items;
            return ok(JSON.stringify(out));
          }

          case "local_registry_component_validate": {
            const code = String(input.code ?? "");
            if (!code.trim()) throw new Error("Missing code.");

            const res = validateComponentCode(code);
            if (!res.ok) return ok(JSON.stringify(res));

            try {
              compileRuntimeComponent(code, validationRuntime as any, { name: "Validate" });
              return ok(JSON.stringify({ ok: true, errors: [] }));
            } catch (e) {
              return ok(
                JSON.stringify({
                  ok: false,
                  errors: [e instanceof Error ? e.message : String(e)],
                }),
              );
            }
          }

          case "local_registry_component_create": {
            const registryId = String(input.registryId ?? "app").trim() || "app";
            const componentName = String(input.componentName ?? "").trim();
            const code = String(input.code ?? "");
            if (!componentName) throw new Error("Missing componentName.");
            if (!code.trim()) throw new Error("Missing code.");

            assertCanWriteToRegistry(registryId, componentName);
            assertValidComponentCode(componentName, code);

            const propsSchema = ensureJsonString(input.propsSchema);

            const created = await registry.add(registryId, componentName, code, propsSchema);
            return ok(JSON.stringify(created));
          }

          case "local_registry_component_update": {
            const registryId = String(input.registryId ?? "app").trim() || "app";
            const componentName = String(input.componentName ?? "").trim();
            const code = String(input.code ?? "");
            if (!componentName) throw new Error("Missing componentName.");
            if (!code.trim()) throw new Error("Missing code.");

            assertCanWriteToRegistry(registryId, componentName);
            assertValidComponentCode(componentName, code);

            let id = input.id ? String(input.id).trim() : "";
            if (!id) {
              const item = (registry.items ?? []).find(
                (x) => x.registryId === registryId && x.name === componentName,
              );
              if (!item) throw new Error("Registry component not found.");
              id = item.id;
            }

            const propsSchema = ensureJsonString(input.propsSchema);
            const updated = await registry.update(id, registryId, componentName, code, propsSchema);
            return ok(JSON.stringify(updated));
          }

          case "local_registry_component_delete": {
            let id = input.id ? String(input.id).trim() : "";
            if (!id) {
              const registryId = String(input.registryId ?? "app").trim() || "app";
              const componentName = String(input.componentName ?? "").trim();
              if (!componentName) throw new Error("Missing componentName (or id).");
              const item = (registry.items ?? []).find(
                (x) => x.registryId === registryId && x.name === componentName,
              );
              if (!item) throw new Error("Registry component not found.");
              id = item.id;
            }

            await registry.delete(id);
            return ok("OK");
          }

          default:
            throw new Error(`Unsupported tool: ${toolCall.toolName}`);
        }
      } catch (e) {
        return fail(e);
      }
    },
    [registry],
  );

  return { name: localRegistryPluginDef.name, handle };
}

