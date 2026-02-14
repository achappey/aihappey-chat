"use client";

import React, { type ComponentType, type ReactNode, useMemo } from "react";
import type {
  Spec,
  Action,
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
import type {
  ComponentRenderProps as JsonRenderComponentRenderProps,
  ComponentRenderer as JsonRenderComponentRenderer,
  ComponentRegistry as JsonRenderComponentRegistry,
} from "@json-render/react";

/**
 * Props passed to component renderers
 */
export interface ComponentRenderProps<P = Record<string, unknown>> {
  /** Base json-render props */
  element: JsonRenderComponentRenderProps<P>["element"];
  children?: JsonRenderComponentRenderProps<P>["children"];
  emit: JsonRenderComponentRenderProps<P>["emit"];
  bindings?: JsonRenderComponentRenderProps<P>["bindings"];
  loading?: JsonRenderComponentRenderProps<P>["loading"];
  /** Execute an action */
  onAction?: (action: Action | string) => void;
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

function resolveRenderableRoot(spec: Spec): string | null {
  const elements = (spec as any)?.elements ?? {};
  const root = String((spec as any)?.root ?? "").trim();
  if (root && elements[root]) return root;

  if (elements.app) return "app";

  const referenced = new Set<string>();
  for (const key of Object.keys(elements)) {
    const children = (elements[key] as any)?.children;
    if (!Array.isArray(children)) continue;
    for (const childKey of children) {
      referenced.add(String(childKey));
    }
  }

  const candidates = Object.keys(elements).filter((k) => !referenced.has(k));
  if (candidates.length === 1) return candidates[0];

  return null;
}

function resolveStreamingFallbackRoot(
  spec: Spec,
  lastRenderableRoot: string | null,
  loading?: boolean,
): string | null {
  const elements = (spec as any)?.elements ?? {};
  const keys = Object.keys(elements);
  if (keys.length === 0) return null;

  const root = String((spec as any)?.root ?? "").trim();
  const shouldAttemptFallback = Boolean(loading) || !root;
  if (!shouldAttemptFallback) return null;

  if (lastRenderableRoot && elements[lastRenderableRoot]) {
    return lastRenderableRoot;
  }

  const referenced = new Set<string>();
  for (const key of keys) {
    const children = (elements[key] as any)?.children;
    if (!Array.isArray(children)) continue;
    for (const childKey of children) {
      referenced.add(String(childKey));
    }
  }

  const candidates = keys.filter((k) => !referenced.has(k)).sort();
  if (candidates.length > 0) return candidates[0];

  return keys.sort()[0] ?? null;
}

function LegacyActionBridge({
  Component,
  props,
}: {
  Component: ComponentRenderer<any>;
  props: JsonRenderComponentRenderProps<any>;
}) {
  const { execute } = useActions();

  const onAction = (action: unknown) => {
    if (typeof action === "string") {
      props.emit(action);
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
  const issueSignatureRef = React.useRef("");
  const lastRenderableRootRef = React.useRef<string | null>(null);
  const lastRenderableSpecRef = React.useRef<Spec | null>(null);

  const normalizedSpec = useMemo(() => {
    if (!spec) return null;

    const validation = validateSpec(spec);
    if (validation.valid) {
      issueSignatureRef.current = "";
      const renderRoot = resolveRenderableRoot(spec);
      if (!renderRoot) {
        const fallbackRoot = resolveStreamingFallbackRoot(
          spec,
          lastRenderableRootRef.current,
          loading,
        );
        if (!fallbackRoot) {
          if (loading && lastRenderableSpecRef.current) {
            return lastRenderableSpecRef.current;
          }
          return null;
        }
        const nextSpec = fallbackRoot === spec.root ? spec : { ...spec, root: fallbackRoot };
        lastRenderableRootRef.current = fallbackRoot;
        lastRenderableSpecRef.current = nextSpec;
        return nextSpec;
      }
      lastRenderableRootRef.current = renderRoot;
      const nextSpec = renderRoot === spec.root ? spec : { ...spec, root: renderRoot };
      lastRenderableSpecRef.current = nextSpec;
      return nextSpec;
    }

    const fixed = autoFixSpec(spec);
    const recheck = validateSpec(fixed.spec);
    const signature = JSON.stringify(recheck.issues.map((i) => `${i.code}:${i.elementKey ?? ""}`));
    if (!recheck.valid && signature !== issueSignatureRef.current) {
      issueSignatureRef.current = signature;
      console.warn("json-render spec validation issues", recheck.issues);
    }
    if (fixed.fixes.length > 0) {
      console.info("json-render auto-fixes applied", fixed.fixes);
    }

    const renderRoot = resolveRenderableRoot(fixed.spec as Spec);
    if (!renderRoot) {
      const fallbackRoot = resolveStreamingFallbackRoot(
        fixed.spec as Spec,
        lastRenderableRootRef.current,
        loading,
      );
      if (!fallbackRoot) {
        if (loading && lastRenderableSpecRef.current) {
          return lastRenderableSpecRef.current;
        }
        return null;
      }
      lastRenderableRootRef.current = fallbackRoot;
      const nextSpec = fallbackRoot === (fixed.spec as any)?.root
        ? fixed.spec
        : { ...(fixed.spec as any), root: fallbackRoot };
      lastRenderableSpecRef.current = nextSpec as Spec;
      return nextSpec;
    }

    lastRenderableRootRef.current = renderRoot;
    const nextSpec = renderRoot === (fixed.spec as any)?.root
      ? fixed.spec
      : { ...(fixed.spec as any), root: renderRoot };
    lastRenderableSpecRef.current = nextSpec as Spec;
    return nextSpec;
  }, [spec, loading]);

  const compatibleRegistry = useMemo<JsonRenderComponentRegistry>(() => {
    const wrappedEntries = Object.entries(registry).map(([name, Component]) => {
      const Wrapped: JsonRenderComponentRenderer<any> = (props) => (
        <LegacyActionBridge Component={Component} props={props} />
      );
      Wrapped.displayName = `Compat(${name})`;
      return [name, Wrapped];
    });
    return Object.fromEntries(wrappedEntries);
  }, [registry]);

  const compatibleFallback = useMemo<JsonRenderComponentRenderer<Record<string, unknown>> | undefined>(
    () => (fallback ? ((props) => <LegacyActionBridge Component={fallback} props={props} />) : undefined),
    [fallback],
  );

  if (!normalizedSpec) return null;

  return (
    <JsonRenderRenderer
      spec={normalizedSpec}
      registry={compatibleRegistry}
      loading={loading}
      fallback={compatibleFallback}
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
  /** Action handlers */
  handlers?: Record<
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
  handlers,
  navigate,
  validationFunctions,
  onStateChange,
  children,
}: JSONUIProviderProps) {
  return (
    <StateProvider
      initialState={initialState}
      onStateChange={onStateChange}
    >
      <VisibilityProvider>
        <ActionProvider handlers={handlers} navigate={navigate}>
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
