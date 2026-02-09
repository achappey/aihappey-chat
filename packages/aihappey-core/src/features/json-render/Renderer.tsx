"use client";

import React, { type ComponentType, type ReactNode, useMemo } from "react";
import type {
  UIElement,
  Spec,
  Action,
  Catalog,
  ComponentDefinition,
  SchemaDefinition,
} from "@json-render/core";
import { validateSpec, autoFixSpec } from "@json-render/core";
import {
  Renderer as JsonRenderRenderer,
  StateProvider,
  VisibilityProvider,
  ActionProvider,
  ValidationProvider,
  ConfirmDialog,
  useActions,
} from "@json-render/react";

/**
 * Props passed to component renderers
 */
export interface ComponentRenderProps<P = Record<string, unknown>> {
  /** The element being rendered */
  element: UIElement<string, P>;
  /** Rendered children */
  children?: ReactNode;
  /** Emit a named event mapped from element.on */
  emit?: (event: string) => void;
  /** Execute an action */
  onAction?: (action: Action) => void;
  /** Whether the parent is loading */
  loading?: boolean;
}

/**
 * Component renderer type
 */
export type ComponentRenderer<P = Record<string, unknown>> = ComponentType<
  ComponentRenderProps<P>
>;

/**
 * Registry of component renderers
 */
export type ComponentRegistry = Record<string, ComponentRenderer<any>>;

/**
 * Props for the Renderer component
 */
export interface RendererProps {
  /** The UI spec to render */
  spec: Spec | null;
  /** Component registry */
  registry: ComponentRegistry;
  /** Whether the tree is currently loading/streaming */
  loading?: boolean;
  /** Fallback component for unknown types */
  fallback?: ComponentRenderer;
}

function LegacyActionBridge({
  Component,
  props,
}: {
  Component: ComponentRenderer<any>;
  props: any;
}) {
  const { execute } = useActions();

  const onAction = (action: unknown) => {
    if (typeof action === "string") {
      props.emit?.(action);
      return;
    }
    if (action && typeof action === "object" && "action" in (action as Record<string, unknown>)) {
      void execute(action as Action);
    }
  };

  return <Component {...props} onAction={onAction} />;
}

/**
 * Main renderer component
 */
export function Renderer({ spec, registry, loading, fallback }: RendererProps) {
  const normalizedSpec = useMemo(() => {
    if (!spec) return null;

    const validation = validateSpec(spec);
    if (validation.valid) {
      return spec;
    }

    const fixed = autoFixSpec(spec);
    const recheck = validateSpec(fixed.spec);
    if (!recheck.valid) {
      console.warn("json-render spec validation issues", recheck.issues);
    }
    if (fixed.fixes.length > 0) {
      console.info("json-render auto-fixes applied", fixed.fixes);
    }

    return fixed.spec;
  }, [spec]);

  const compatibleRegistry = useMemo<ComponentRegistry>(() => {
    const wrappedEntries = Object.entries(registry).map(([name, Component]) => {
      const Wrapped: ComponentRenderer<any> = (props) => (
        <LegacyActionBridge Component={Component} props={props} />
      );
      Wrapped.displayName = `Compat(${name})`;
      return [name, Wrapped];
    });
    return Object.fromEntries(wrappedEntries);
  }, [registry]);

  if (!normalizedSpec) return null;

  return (
    <JsonRenderRenderer
      spec={normalizedSpec}
      registry={compatibleRegistry}
      loading={loading}
      fallback={fallback}
    />
  );
}

/**
 * Props for JSONUIProvider
 */
export interface JSONUIProviderProps {
  /** Component registry */
  registry: ComponentRegistry;
  /** Initial state model */
  initialState?: Record<string, unknown>;
  /** Initial data model */
  initialData?: Record<string, unknown>;
  /** Auth state */
  authState?: { isSignedIn: boolean; user?: Record<string, unknown> };
  /** Action handlers */
  actionHandlers?: Record<
    string,
    (params: Record<string, unknown>) => Promise<unknown> | unknown
  >;
  /** Navigation function */
  navigate?: (path: string) => void;
  /** Custom validation functions */
  validationFunctions?: Record<
    string,
    (value: unknown, args?: Record<string, unknown>) => boolean
  >;
  /** Callback when state changes */
  onStateChange?: (path: string, value: unknown) => void;
  /** Callback when data changes */
  onDataChange?: (path: string, value: unknown) => void;
  children: ReactNode;
}

// Import the providers
//import { DataProvider } from "./contexts/data";
//import { VisibilityProvider } from "./contexts/visibility";
//import { ActionProvider } from "./contexts/actions";
//import { ValidationProvider } from "./contexts/validation";
//import { ConfirmDialog } from "./contexts/actions";

/**
 * Combined provider for all JSONUI contexts
 */
export function JSONUIProvider({
  registry,
  initialState,
  initialData,
  authState,
  actionHandlers,
  navigate,
  validationFunctions,
  onStateChange,
  onDataChange,
  children,
}: JSONUIProviderProps) {
  const seededState = initialState ?? initialData;
  const handleStateChange = onStateChange ?? onDataChange;

  return (
    <StateProvider
      initialState={seededState}
      authState={authState}
      onStateChange={handleStateChange}
    >
      <VisibilityProvider>
        <ActionProvider handlers={actionHandlers} navigate={navigate}>
          <ValidationProvider customFunctions={validationFunctions}>
            {children}
            <ConfirmationDialogManager />
          </ValidationProvider>
        </ActionProvider>
      </VisibilityProvider>
    </StateProvider>
  );
}

/**
 * Renders the confirmation dialog when needed
 */
function ConfirmationDialogManager() {
  const { pendingConfirmation, confirm, cancel } = useActions();

  if (!pendingConfirmation?.action.confirm) {
    return null;
  }

  return (
    <ConfirmDialog
      confirm={pendingConfirmation.action.confirm}
      onConfirm={confirm}
      onCancel={cancel}
    />
  );
}

export function createRendererFromCatalog<
  S extends SchemaDefinition<any, any>,
  C extends Catalog<S>
>(
  _catalog: C,
  registry: ComponentRegistry,
): ComponentType<Omit<RendererProps, "registry">> {
  return function CatalogRenderer(props: Omit<RendererProps, "registry">) {
    return <Renderer {...props} registry={registry} />;
  };
}


/**
 * Helper to create a renderer component from a catalog
 */
/*export function createRendererFromCatalog2<
  C extends Catalog<Record<string, ComponentDefinition>>,
>(
  _catalog: C,
  registry: ComponentRegistry,
): ComponentType<Omit<RendererProps, "registry">> {
  return function CatalogRenderer(props: Omit<RendererProps, "registry">) {
    return <Renderer {...props} registry={registry} />;
  };
}
*/
