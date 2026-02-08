import { useMemo } from "react";
import {
  buildRuntimeActionRegistryForId,
  buildRuntimeRegistryForId,
  mergeComponentRegistries,
  type JsonRenderActionItem,
  type JsonRenderRegistryItem,
  useJsonRenderRegistry,
  type RegistryRuntime,
  type RuntimeActionError,
  type RuntimeActionRegistry,
  type RuntimeRegistryError,
  type RuntimeComponentRegistry,
} from "aihappey-json-render-registry";
import {
  BUILT_IN_REGISTRY_LABELS,
  builtInRegistryItems as packageBuiltInRegistryItems,
  defaultComponentRegistry,
  defaultRegistryBundles,
  defaultRegistryBundleIds,
  defaultRuntimeBindings,
} from "aihappey-ai-components-default";

const LEGACY_DEFAULT_REGISTRY_TOKENS = new Set(["__default__", "built-in"]);

export const builtInRegistryLabels = BUILT_IN_REGISTRY_LABELS;

const mapLegacyRegistryId = (id: string): string[] => {
  if (LEGACY_DEFAULT_REGISTRY_TOKENS.has(id)) {
    return ["app"];
  }
  return [id];
};

const normalizeRegistryIds = (registryIds: string[]): string[] => {
  const ids = (registryIds ?? []).filter(Boolean).flatMap(mapLegacyRegistryId);
  return Array.from(new Set(ids));
};

export function mapLegacyDefaultRegistrySelection(registryList?: string): string | undefined {
  const trimmed = String(registryList ?? "").trim();
  if (!trimmed) return undefined;

  const tokens = trimmed
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

  const normalized = tokens.flatMap((token) => mapLegacyRegistryId(token));
  return Array.from(new Set(normalized)).join(",");
}

const buildDefaultRegistryBase = (registryIds: string[]): RuntimeComponentRegistry => {
  const ids = normalizeRegistryIds(registryIds);
  let base: RuntimeComponentRegistry = { ...defaultComponentRegistry };

  for (const bundle of defaultRegistryBundles) {
    if (ids.includes(bundle.id)) {
      base = mergeComponentRegistries(base, bundle.registry as RuntimeComponentRegistry);
    }
  }

  return base;
};

export const componentRegistry = defaultComponentRegistry;

export const buildCombinedComponentRegistry = (
  registryItems: JsonRenderRegistryItem[],
  runtime: RegistryRuntime,
  registryId: string,
): {
  registry: RuntimeComponentRegistry;
  errors: RuntimeRegistryError[];
} => {
  const { registry: runtimeRegistry, errors } = buildRuntimeRegistryForId(
    registryItems,
    runtime,
    registryId,
  );

  return {
    registry: mergeComponentRegistries(
      buildDefaultRegistryBase([registryId]),
      runtimeRegistry,
    ),
    errors,
  };
};

export const buildCombinedComponentRegistryForIds = (
  registryItems: JsonRenderRegistryItem[],
  runtime: RegistryRuntime,
  registryIds: string[],
): {
  registry: RuntimeComponentRegistry;
  errors: RuntimeRegistryError[];
} => {
  const ids = normalizeRegistryIds(registryIds);

  let runtimeRegistry: RuntimeComponentRegistry = {};
  const errors: RuntimeRegistryError[] = [];

  for (const rid of ids) {
    const res = buildRuntimeRegistryForId(registryItems, runtime, rid);
    runtimeRegistry = mergeComponentRegistries(runtimeRegistry, res.registry);
    errors.push(
      ...res.errors.map((e) => ({
        ...e,
        message: `[${rid}] ${e.message}`,
      })),
    );
  }

  return {
    registry: mergeComponentRegistries(buildDefaultRegistryBase(ids), runtimeRegistry),
    errors,
  };
};

export const buildCombinedActionRegistry = (
  actionItems: JsonRenderActionItem[],
  runtime: RegistryRuntime,
  registryId: string,
): {
  handlers: RuntimeActionRegistry;
  errors: RuntimeActionError[];
} => {
  const { handlers, errors } = buildRuntimeActionRegistryForId(
    actionItems,
    runtime,
    registryId,
  );
  return {
    handlers,
    errors,
  };
};

export const buildCombinedActionRegistryForIds = (
  actionItems: JsonRenderActionItem[],
  runtime: RegistryRuntime,
  registryIds: string[],
): {
  handlers: RuntimeActionRegistry;
  errors: RuntimeActionError[];
} => {
  const ids = normalizeRegistryIds(registryIds);

  let handlers: RuntimeActionRegistry = {};
  const errors: RuntimeActionError[] = [];

  for (const rid of ids) {
    const res = buildRuntimeActionRegistryForId(actionItems, runtime, rid);
    handlers = { ...handlers, ...res.handlers };
    errors.push(
      ...res.errors.map((e) => ({
        ...e,
        message: `[${rid}] ${e.message}`,
      })),
    );
  }

  return { handlers, errors };
};

export const useCombinedComponentRegistry = (registryId: string) => {
  const { items, actions } = useJsonRenderRegistry();

  const runtime = useMemo<RegistryRuntime>(
    () => ({
      ...(defaultRuntimeBindings as Record<string, unknown>),
    }) as RegistryRuntime,
    [],
  );

  return useMemo(
    () => {
      const components = buildCombinedComponentRegistry(items, runtime, registryId);
      const actionRuntime = buildCombinedActionRegistry(actions, runtime, registryId);
      return {
        ...components,
        actionHandlers: actionRuntime.handlers,
        actionErrors: actionRuntime.errors,
      };
    },
    [actions, items, runtime, registryId],
  );
};

export const useCombinedComponentRegistryForIds = (registryIds: string[]) => {
  const { items, actions } = useJsonRenderRegistry();

  const runtime = useMemo<RegistryRuntime>(
    () => ({
      ...(defaultRuntimeBindings as Record<string, unknown>),
    }) as RegistryRuntime,
    [],
  );

  const idsKey = normalizeRegistryIds(registryIds).slice().sort().join("|");

  return useMemo(
    () => {
      const components = buildCombinedComponentRegistryForIds(items, runtime, registryIds);
      const actionRuntime = buildCombinedActionRegistryForIds(actions, runtime, registryIds);
      return {
        ...components,
        actionHandlers: actionRuntime.handlers,
        actionErrors: actionRuntime.errors,
      };
    },
    [actions, items, runtime, idsKey],
  );
};

export const builtInRegistryItems: JsonRenderRegistryItem[] =
  packageBuiltInRegistryItems as JsonRenderRegistryItem[];

