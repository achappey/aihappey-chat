"use client";

import React, { type ReactNode, useCallback, useMemo } from "react";
import type { ComputedFunction, Spec, StateStore } from "@json-render/core";
import { validateSpec, autoFixSpec } from "@json-render/core";
import {
  Renderer as JsonRenderRenderer,
  JSONUIProvider as NativeJSONUIProvider,
} from "@json-render/react";
import type {
  ComponentRenderProps as JsonRenderComponentRenderProps,
  ComponentRenderer as JsonRenderComponentRenderer,
  ComponentRegistry as JsonRenderComponentRegistry,
  JSONUIProviderProps as NativeJSONUIProviderProps,
} from "@json-render/react";

/**
 * Props passed to component renderers
 */
export type ComponentRenderProps<P = Record<string, unknown>> = JsonRenderComponentRenderProps<P>;

/**
 * Component renderer type
 */
export type ComponentRenderer<P = Record<string, unknown>> = JsonRenderComponentRenderer<P>;

/**
 * Registry of component renderers
 */
export type ComponentRegistry = JsonRenderComponentRegistry;

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

export interface StateChange {
  path: string;
  value: unknown;
}

export type LegacyStateChangeHandler = (path: string, value: unknown) => void;

export type BatchedStateChangeHandler = (changes: StateChange[]) => void;

export type StateChangeHandler = LegacyStateChangeHandler | BatchedStateChangeHandler;

function isLegacyStateChangeHandler(
  handler: StateChangeHandler,
): handler is LegacyStateChangeHandler {
  return handler.length >= 2;
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

  if (!normalizedSpec) return null;

  return (
    <JsonRenderRenderer
      spec={normalizedSpec}
      registry={registry}
      loading={loading}
      fallback={fallback}
    />
  );
}

/**
 * Props for JSONUIProvider
 */
export interface JSONUIProviderProps extends Omit<NativeJSONUIProviderProps, "onStateChange"> {
  /**
   * Callback when state changes.
   *
   * Supports the json-render v0.16 batched `changes[]` signature while still
   * accepting the legacy `(path, value)` callback during migration.
   */
  onStateChange?: StateChangeHandler;
  /** Controlled store for native json-render state management */
  store?: StateStore;
  /** Named functions for `$computed` expressions */
  functions?: Record<string, ComputedFunction>;
  children: ReactNode;
}

/**
 * Combined provider for all JSONUI contexts
 */
export function JSONUIProvider({
  registry,
  store,
  initialState,
  handlers,
  navigate,
  validationFunctions,
  functions,
  onStateChange,
  children,
}: JSONUIProviderProps) {
  const compatibleOnStateChange = useCallback(
    (changes: StateChange[]) => {
      if (!onStateChange) return;

      if (isLegacyStateChangeHandler(onStateChange)) {
        for (const { path, value } of changes) {
          onStateChange(path, value);
        }
        return;
      }

      onStateChange(changes);
    },
    [onStateChange],
  );

  return (
    <NativeJSONUIProvider
      registry={registry}
      store={store}
      initialState={initialState}
      handlers={handlers}
      navigate={navigate}
      validationFunctions={validationFunctions}
      functions={functions}
      onStateChange={onStateChange ? compatibleOnStateChange : undefined}
    >
      {children}
    </NativeJSONUIProvider>
  );
}
