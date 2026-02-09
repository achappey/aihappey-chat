import type { ComponentType } from "react";
import type {
  BuildRuntimeActionRegistryResult,
  BuildRuntimeRegistryResult,
  JsonRenderActionItem,
  JsonRenderRegistryItem,
  RegistryRuntime,
  RuntimeActionRegistry,
  RuntimeComponentRegistry,
  RuntimeActionError,
  RuntimeRegistryError,
  ValidationResult,
} from "./types";

export const DEFAULT_RUNTIME_BINDINGS = [
  "React",
  "useStateBinding",
  "useStateValue",
  "useAction",
  "useActions",
  "useStateStore",
  "useIsVisible",
  "useFieldValidation",
  "useValidation",
  // Optional UI/theme helpers that can be provided by the host app.
  // If present in the runtime object, registry components/actions can use them.
  "useTheme",
  "useDarkMode",
];

const DEFAULT_FORBIDDEN_PATTERNS: RegExp[] = [
  /\bwindow\b/gi,
  /\bdocument\b/gi,
  /\blocalStorage\b/gi,
  /\bsessionStorage\b/gi,
  /\bindexedDB\b/gi,
  /\bXMLHttpRequest\b/gi,
  /\bWebSocket\b/gi,
  /\beval\b/gi,
  /\bFunction\b/gi,
  /\bimport\b/gi,
  /\bexport\b/gi,
  /\brequire\b/gi,
  /\bprocess\b/gi,
  /\bglobalThis\b/gi,
  /\bsetTimeout\b/gi,
  /\bsetInterval\b/gi,
  /\bsetImmediate\b/gi,
  /\brequestAnimationFrame\b/gi,
  /\bcancelAnimationFrame\b/gi,
];

export function validateComponentCode(
  code: string,
  options?: { forbidden?: RegExp[] },
): ValidationResult {
  const forbidden = options?.forbidden ?? DEFAULT_FORBIDDEN_PATTERNS;
  const errors = forbidden
    .filter((pattern) => pattern.test(code))
    .map((pattern) => `Forbidden token: ${pattern.source}`);

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function compileRuntimeComponent(
  code: string,
  runtime: RegistryRuntime,
  options?: {
    bindings?: string[];
    name?: string;
    validator?: (code: string) => ValidationResult;
  },
): ComponentType<any> {
  const validator = options?.validator ?? validateComponentCode;
  const validation = validator(code);
  if (!validation.ok) {
    throw new Error(validation.errors.join("; "));
  }

  const bindings = options?.bindings ?? DEFAULT_RUNTIME_BINDINGS;
  const bindingList = bindings.join(", ");
  const factorySource = `"use strict"; const { ${bindingList} } = runtime; return (${code});`;
  const factory = new Function("runtime", factorySource) as (
    runtime: RegistryRuntime,
  ) => unknown;
  const renderFn = factory(runtime);

  if (typeof renderFn !== "function") {
    throw new Error("Runtime component code must return a function.");
  }

  const Component: ComponentType<any> = (props) =>
    (renderFn as (props: any, ctx?: RegistryRuntime) => unknown)(
      props,
      runtime,
    ) as any;

  Component.displayName = options?.name
    ? `Runtime(${options.name})`
    : "RuntimeComponent";

  return Component;
}

export function buildRuntimeRegistry(
  items: JsonRenderRegistryItem[],
  runtime: RegistryRuntime,
  options?: {
    bindings?: string[];
    validator?: (code: string) => ValidationResult;
    registryId?: string;
  },
): BuildRuntimeRegistryResult {
  const registry: RuntimeComponentRegistry = {};
  const errors: RuntimeRegistryError[] = [];
  const scopedItems = options?.registryId
    ? items.filter((item) => item.registryId === options.registryId)
    : items;

  scopedItems.forEach((item) => {
    try {
      const Component = compileRuntimeComponent(item.code, runtime, {
        bindings: options?.bindings,
        validator: options?.validator,
        name: item.name,
      });
      registry[item.name] = Component;
    } catch (error) {
      errors.push({
        id: item.id,
        name: item.name,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  return { registry, errors };
}

export function buildRuntimeRegistryForId(
  items: JsonRenderRegistryItem[],
  runtime: RegistryRuntime,
  registryId: string,
  options?: {
    bindings?: string[];
    validator?: (code: string) => ValidationResult;
  },
): BuildRuntimeRegistryResult {
  return buildRuntimeRegistry(items, runtime, {
    ...options,
    registryId,
  });
}

export function mergeComponentRegistries(
  base: RuntimeComponentRegistry,
  overrides: RuntimeComponentRegistry,
): RuntimeComponentRegistry {
  return {
    ...base,
    ...overrides,
  };
}

export function compileRuntimeAction(
  code: string,
  runtime: RegistryRuntime,
  options?: {
    bindings?: string[];
    name?: string;
    validator?: (code: string) => ValidationResult;
  },
): (params: Record<string, unknown>) => Promise<unknown> | unknown {
  const validator = options?.validator ?? validateComponentCode;
  const validation = validator(code);
  if (!validation.ok) {
    throw new Error(validation.errors.join("; "));
  }

  const bindings = options?.bindings ?? DEFAULT_RUNTIME_BINDINGS;
  const bindingList = bindings.join(", ");
  const factorySource = `"use strict"; const { ${bindingList} } = runtime; return (${code});`;
  const factory = new Function("runtime", factorySource) as (
    runtime: RegistryRuntime,
  ) => unknown;
  const handler = factory(runtime);

  if (typeof handler !== "function") {
    throw new Error("Runtime action code must return a function.");
  }

  return handler as (params: Record<string, unknown>) => Promise<unknown> | unknown;
}

export function buildRuntimeActionRegistry(
  items: JsonRenderActionItem[],
  runtime: RegistryRuntime,
  options?: {
    bindings?: string[];
    validator?: (code: string) => ValidationResult;
    registryId?: string;
  },
): BuildRuntimeActionRegistryResult {
  const handlers: RuntimeActionRegistry = {};
  const errors: RuntimeActionError[] = [];
  const scopedItems = options?.registryId
    ? items.filter((item) => item.registryId === options.registryId)
    : items;

  scopedItems.forEach((item) => {
    try {
      const handler = compileRuntimeAction(item.code, runtime, {
        bindings: options?.bindings,
        validator: options?.validator,
        name: item.name,
      });
      handlers[item.name] = handler;
    } catch (error) {
      errors.push({
        id: item.id,
        name: item.name,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  return { handlers, errors };
}

export function buildRuntimeActionRegistryForId(
  items: JsonRenderActionItem[],
  runtime: RegistryRuntime,
  registryId: string,
  options?: {
    bindings?: string[];
    validator?: (code: string) => ValidationResult;
  },
): BuildRuntimeActionRegistryResult {
  return buildRuntimeActionRegistry(items, runtime, {
    ...options,
    registryId,
  });
}
