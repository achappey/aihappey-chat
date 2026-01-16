import * as React from "react";
import { createContext, useContext, useMemo, useCallback } from "react";
import { useDarkMode, useLocalStorage } from "usehooks-ts";
import {
  FluentProvider,
  createDarkTheme,
  createLightTheme,
  createTeamsDarkTheme,
} from "@fluentui/react-components";
import type { BrandVariants, Theme } from "@fluentui/react-components";

import { ThemeContext } from "aihappey-components";
import { fluentTheme } from "./primitives";
import {
  buildFluentThemePresets,
  FluentThemePreset,
  // FluentThemePresetId, // <- you likely have this as a union; see type update below
} from "./fluentThemePresets";

import { brandVariantsFromBaseColor } from "./brandVariantsFromBaseColor";
import {
  brandVariantsFromDesignerParams,
  BrandDesignerParams,
} from "./brandVariantsFromDesignerParams";

/**
 * ✅ IMPORTANT: allow dynamic ids.
 * If you currently have:
 *   export type FluentThemePresetId = "web" | "teams" | ...
 * change it to:
 *   export type FluentThemePresetId = "web" | "teams" | "teamsv21" | "brand" | `custom:${string}`;
 */
export type FluentThemePresetId =
  | "web"
  | "azure"
  | "teams"
  | "teamsv21"
  | `custom:${string}`
  | `brand:${string}`
  | `teams:brand:${string}`;

type CustomBrandPreset = {
  id: FluentThemePresetId; // always "custom:..."
  title: string;
  baseHex: string; // "#RRGGBB"
  hueTorsion?: number;
  vibrancy?: number;
};

type CustomBrandPresetMap = Record<string, CustomBrandPreset>;

type FluentThemePresetMap = Record<string, FluentThemePreset>;

type FluentThemePresetContextValue = {
  presetId: FluentThemePresetId;
  setPresetId: (id: FluentThemePresetId) => void;
  presets: FluentThemePresetMap;

  // ✅ new:
  customPresets: CustomBrandPreset[];
  addCustomPreset: (title: string, baseHex: string) => FluentThemePresetId;
  updateCustomPreset: (
    id: FluentThemePresetId,
    patch: Partial<Pick<CustomBrandPreset, "title" | "baseHex" | "hueTorsion" | "vibrancy">>
  ) => void;
  removeCustomPreset: (id: FluentThemePresetId) => void;
  getCustomPreset: (id: FluentThemePresetId) => CustomBrandPreset | undefined;
};

const FluentThemePresetContext =
  createContext<FluentThemePresetContextValue | undefined>(undefined);

export function useFluentThemePreset() {
  const ctx = useContext(FluentThemePresetContext);
  if (!ctx)
    throw new Error("useFluentThemePreset must be used within <ThemeProvider />");
  return ctx;
}

const CUSTOM_PRESETS_KEY = "fluent-custom-brand-presets";

function slug(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

function makeId(title: string): FluentThemePresetId {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? (crypto as any).randomUUID().slice(0, 8)
      : Math.random().toString(16).slice(2, 10);

  return `custom:${slug(title) || "brand"}-${rand}` as const;
}

function makeBrandPreset(
  id: FluentThemePresetId,
  title: string,
  variants: BrandVariants
): FluentThemePreset {
  return {
    id,
    title,
    getTheme: ({ mode }: { mode: "light" | "dark" }): Theme =>
      mode === "dark" ? id.startsWith("teams:") ? createTeamsDarkTheme(variants)
        : createDarkTheme(variants) : createLightTheme(variants),
  };
}

export function ThemeProvider({
  children,
  brandVariants,
  defaultPresetId = "web",
  presetId: controlledPresetId,
  onPresetChange,
  persistKey = "fluent-theme-preset",
}: {
  children: React.ReactNode;
  brandVariants?: Record<string, BrandVariants>;
  defaultPresetId?: FluentThemePresetId;
  presetId?: FluentThemePresetId;
  onPresetChange?: (id: FluentThemePresetId) => void;
  persistKey?: string;
}) {
  const { isDarkMode } = useDarkMode();
  const mode: "light" | "dark" = isDarkMode ? "dark" : "light";

  // ✅ persisted preset selection
  const [storedPresetId, setStoredPresetId] = useLocalStorage<FluentThemePresetId>(
    persistKey,
    defaultPresetId
  );

  const presetId = controlledPresetId ?? storedPresetId;

  const setPresetId = (id: FluentThemePresetId) => {
    onPresetChange?.(id);
    if (controlledPresetId === undefined) setStoredPresetId(id);
  };

  // ✅ persisted custom presets
  const [customMap, setCustomMap] = useLocalStorage<CustomBrandPresetMap>(
    CUSTOM_PRESETS_KEY,
    {}
  );

  const customPresets: CustomBrandPreset[] = useMemo(
    () => Object.values(customMap).sort((a, b) => a.title.localeCompare(b.title)),
    [customMap]
  );

  const addCustomPreset = useCallback(
    (title: string, baseHex: string) => {
      const cleanTitle = title.trim();
      const cleanHex = baseHex.trim().toUpperCase();

      const id = makeId(cleanTitle);

      const next: CustomBrandPreset = {
        id,
        title: cleanTitle,
        baseHex: cleanHex,
        hueTorsion: 0,
        vibrancy: 0,
      };

      setCustomMap((prev) => ({ ...prev, [id]: next }));
      return id;
    },
    [setCustomMap]
  );

  const updateCustomPreset = useCallback(
    (
      id: FluentThemePresetId,
      patch: Partial<Pick<CustomBrandPreset, "title" | "baseHex" | "hueTorsion" | "vibrancy">>
    ) => {
      if (!id.startsWith("custom:")) return;
      setCustomMap((prev) => {
        const existing = prev[id];
        if (!existing) return prev;
        const next: CustomBrandPreset = {
          ...existing,
          ...patch,
          title: (patch.title ?? existing.title).trim(),
          baseHex: (patch.baseHex ?? existing.baseHex).trim().toUpperCase(),
        };
        return { ...prev, [id]: next };
      });
    },
    [setCustomMap]
  );

  const removeCustomPreset = useCallback(
    (id: FluentThemePresetId) => {
      setCustomMap((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });

      // fallback if you removed the active preset
      if (presetId === id) setPresetId(defaultPresetId);
    },
    [setCustomMap, presetId, setPresetId, defaultPresetId]
  );

  const getCustomPreset = useCallback(
    (id: FluentThemePresetId) => {
      return customMap[id];
    },
    [customMap]
  );

  // ✅ build base presets (your existing ones)
  const basePresets = useMemo(
    () => buildFluentThemePresets(brandVariants),
    [brandVariants]
  );

  // ✅ build custom presets from stored base colors
  const customPresetEntries = useMemo(() => {
    const out: FluentThemePresetMap = {};
    for (const p of customPresets) {
      const variants = brandVariantsFromDesignerParams({
        baseHex: p.baseHex,
        hueTorsion: p.hueTorsion ?? 0,
        vibrancy: p.vibrancy ?? 0,
        mode: "lch",
      } satisfies BrandDesignerParams);
      out[p.id] = makeBrandPreset(p.id, p.title, variants);
    }
    return out;
  }, [customPresets]);

  // ✅ merged presets ordered by preset.title
  const presets: FluentThemePresetMap = useMemo(() => {
    const merged = { ...basePresets, ...customPresetEntries };

    return Object.entries(merged)
      .sort(([, a], [, b]) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
      )
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as FluentThemePresetMap);
  }, [basePresets, customPresetEntries]);


  const theme: Theme = useMemo(() => {
    const preset = presets[presetId] ?? presets.web ?? Object.values(presets)[0];
    return preset.getTheme({ mode });
  }, [presets, presetId, mode]);

  const ctxValue = useMemo<FluentThemePresetContextValue>(
    () => ({
      presetId,
      setPresetId,
      presets,
      customPresets,
      addCustomPreset,
      updateCustomPreset,
      removeCustomPreset,
      getCustomPreset,
    }),
    [
      presetId,
      presets,
      customPresets,
      addCustomPreset,
      updateCustomPreset,
      removeCustomPreset,
      getCustomPreset,
    ]
  );

  return (
    <ThemeContext.Provider value={fluentTheme}>
      <FluentThemePresetContext.Provider value={ctxValue}>
        <FluentProvider theme={theme}>{children}</FluentProvider>
      </FluentThemePresetContext.Provider>
    </ThemeContext.Provider>
  );
}
