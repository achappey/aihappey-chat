import * as React from "react";
import { ThemeContext } from "aihappey-components";
import { useDarkMode, useLocalStorage } from "usehooks-ts";
import { shadcnTheme } from "./primitives";
import { shadcnThemeStyles } from "./styles";
import { ShadcnThemePresetContext, type ShadcnThemePresetMap } from "./ShadcnThemeContext";
import {
  buildAppSchemePresets,
  buildBuiltinTailwindPresets,
  buildShadcnPresetStyles,
  createCustomPresetFromStored,
  DEFAULT_SHADCN_PRESET_ID,
  type ShadcnCustomSchemeConfig,
  type ShadcnStoredCustomPreset,
  type ShadcnThemePresetId,
} from "./shadcnThemeTokens";

const CUSTOM_PRESETS_KEY = "shadcn-custom-theme-presets";

function slug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

function makeCustomId(title: string): ShadcnThemePresetId {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(16).slice(2, 10);

  return `custom:${slug(title) || "scheme"}-${rand}` as const;
}

export type ShadcnThemeProviderProps = {
  children: React.ReactNode;
  customSchemes?: Record<string, ShadcnCustomSchemeConfig>;
  defaultPresetId?: ShadcnThemePresetId;
  presetId?: ShadcnThemePresetId;
  onPresetChange?: (id: ShadcnThemePresetId) => void;
  persistKey?: string;
};

export const ThemeProvider = ({
  children,
  customSchemes,
  defaultPresetId = DEFAULT_SHADCN_PRESET_ID,
  presetId: controlledPresetId,
  onPresetChange,
  persistKey = "shadcn-theme-preset",
}: ShadcnThemeProviderProps) => {
  const { isDarkMode } = useDarkMode();
  const colorMode = isDarkMode ? "dark" : "light";
  const [storedPresetId, setStoredPresetId] = useLocalStorage<ShadcnThemePresetId>(
    persistKey,
    defaultPresetId
  );
  const [customMap, setCustomMap] = useLocalStorage<Record<string, ShadcnStoredCustomPreset>>(
    CUSTOM_PRESETS_KEY,
    {}
  );

  const presetId = controlledPresetId ?? storedPresetId;

  const setPresetId = React.useCallback(
    (id: ShadcnThemePresetId) => {
      onPresetChange?.(id);
      if (controlledPresetId === undefined) setStoredPresetId(id);
    },
    [controlledPresetId, onPresetChange, setStoredPresetId]
  );

  const customPresets = React.useMemo(
    () => Object.values(customMap).sort((a, b) => a.title.localeCompare(b.title)),
    [customMap]
  );

  const addCustomPreset = React.useCallback(
    (title: string, baseHex: string, radius?: string) => {
      const id = makeCustomId(title);
      const next: ShadcnStoredCustomPreset = {
        id,
        title: title.trim(),
        baseHex: baseHex.trim().toUpperCase(),
        radius: radius?.trim() || "0.5rem",
      };
      setCustomMap((prev) => ({ ...prev, [id]: next }));
      return id;
    },
    [setCustomMap]
  );

  const updateCustomPreset = React.useCallback(
    (
      id: ShadcnThemePresetId,
      patch: Partial<Pick<ShadcnStoredCustomPreset, "title" | "baseHex" | "radius">>
    ) => {
      if (!id.startsWith("custom:")) return;
      setCustomMap((prev) => {
        const existing = prev[id];
        if (!existing) return prev;
        return {
          ...prev,
          [id]: {
            ...existing,
            ...patch,
            title: (patch.title ?? existing.title).trim(),
            baseHex: (patch.baseHex ?? existing.baseHex).trim().toUpperCase(),
            radius: (patch.radius ?? existing.radius)?.trim() || "0.5rem",
          },
        };
      });
    },
    [setCustomMap]
  );

  const removeCustomPreset = React.useCallback(
    (id: ShadcnThemePresetId) => {
      setCustomMap((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (presetId === id) setPresetId(defaultPresetId);
    },
    [defaultPresetId, presetId, setCustomMap, setPresetId]
  );

  const getCustomPreset = React.useCallback(
    (id: ShadcnThemePresetId) => customMap[id],
    [customMap]
  );

  const presets = React.useMemo<ShadcnThemePresetMap>(() => {
    const builtinPresets = buildBuiltinTailwindPresets();
    const appPresets = buildAppSchemePresets(customSchemes);
    const userPresets = customPresets.reduce<ShadcnThemePresetMap>((acc, customPreset) => {
      acc[customPreset.id] = createCustomPresetFromStored(customPreset);
      return acc;
    }, {});

    return Object.entries({ ...builtinPresets, ...appPresets, ...userPresets })
      .sort(([, a], [, b]) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }))
      .reduce<ShadcnThemePresetMap>((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});
  }, [customPresets, customSchemes]);

  const activePreset = presets[presetId] ?? presets[defaultPresetId] ?? presets[DEFAULT_SHADCN_PRESET_ID] ?? Object.values(presets)[0];
  const activePresetStyles = React.useMemo(() => buildShadcnPresetStyles(activePreset), [activePreset]);

  const ctxValue = React.useMemo(
    () => ({
      presetId: activePreset?.id ?? presetId,
      setPresetId,
      presets,
      customPresets,
      addCustomPreset,
      updateCustomPreset,
      removeCustomPreset,
      getCustomPreset,
    }),
    [
      activePreset?.id,
      addCustomPreset,
      customPresets,
      getCustomPreset,
      presetId,
      presets,
      removeCustomPreset,
      setPresetId,
      updateCustomPreset,
    ]
  );

  React.useEffect(() => {
    const root = document.documentElement;
    const previousTheme = root.getAttribute("data-theme");
    root.setAttribute("data-theme", colorMode);

    return () => {
      if (previousTheme) root.setAttribute("data-theme", previousTheme);
      else root.removeAttribute("data-theme");
    };
  }, [colorMode]);

  return (
    <ThemeContext.Provider value={shadcnTheme}>
      <ShadcnThemePresetContext.Provider value={ctxValue}>
        <style>{shadcnThemeStyles}</style>
        <style>{activePresetStyles}</style>
        <div className={`aih-shadcn-theme ${colorMode}`}>{children}</div>
      </ShadcnThemePresetContext.Provider>
    </ThemeContext.Provider>
  );
};

