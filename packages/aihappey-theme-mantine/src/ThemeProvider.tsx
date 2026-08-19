import * as React from "react";
import { MantineProvider, mergeThemeOverrides, type MantineThemeOverride } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { useDarkMode, useLocalStorage } from "usehooks-ts";
import { ThemeContext } from "aihappey-components";
import { mantineTheme } from "./primitives";
import { MantineThemePresetContext, type MantineThemePresetContextValue } from "./MantineThemeContext";
import { MANTINE_BUILT_IN_PRESETS, mantinePresetOverride, type MantineStoredCustomPreset, type MantineThemePreset, type MantineThemePresetId, type MantineThemeSettings } from "./mantineThemePresets";

import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";

export type MantineThemeProviderProps = {
  children: React.ReactNode;
  theme?: MantineThemeOverride;
  defaultColorScheme?: "light" | "dark" | "auto";
  presets?: Record<string, MantineThemePreset>;
  defaultPresetId?: MantineThemePresetId;
  presetId?: MantineThemePresetId;
  onPresetChange?: (id: MantineThemePresetId) => void;
  persistKey?: string;
};

const CUSTOM_PRESETS_KEY = "mantine-custom-theme-presets";
const makeId = (title: string) => `custom:${title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40) || "theme"}-${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(16).slice(2, 10)}`;

export const ThemeProvider = ({ children, theme, defaultColorScheme = "auto", presets: appPresets = {}, defaultPresetId = "mantine:default", presetId: controlledPresetId, onPresetChange, persistKey = "mantine-theme-preset" }: MantineThemeProviderProps) => {
  const { isDarkMode } = useDarkMode();
  const colorScheme = defaultColorScheme === "auto" ? (isDarkMode ? "dark" : "light") : defaultColorScheme;
  const [storedPresetId, setStoredPresetId] = useLocalStorage<MantineThemePresetId>(persistKey, defaultPresetId);
  const [customMap, setCustomMap] = useLocalStorage<Record<string, MantineStoredCustomPreset>>(CUSTOM_PRESETS_KEY, {});
  const customPresets = React.useMemo(() => Object.values(customMap).filter((preset) => preset?.id && preset?.settings).sort((a, b) => a.title.localeCompare(b.title)), [customMap]);
  const presets = React.useMemo(() => ({ ...MANTINE_BUILT_IN_PRESETS, ...appPresets, ...Object.fromEntries(customPresets.map((preset) => [preset.id, preset])) }), [appPresets, customPresets]);
  const requestedPresetId = controlledPresetId ?? storedPresetId;
  const presetId = presets[requestedPresetId] ? requestedPresetId : (presets[defaultPresetId] ? defaultPresetId : Object.keys(presets)[0]);
  const setPresetId = React.useCallback((id: MantineThemePresetId) => { if (!presets[id]) return; onPresetChange?.(id); if (controlledPresetId === undefined) setStoredPresetId(id); }, [controlledPresetId, onPresetChange, presets, setStoredPresetId]);
  const activePreset = presets[presetId] ?? MANTINE_BUILT_IN_PRESETS["mantine:default"];
  const resolvedTheme = React.useMemo(() => mergeThemeOverrides(theme ?? {}, mantinePresetOverride(activePreset)), [activePreset, theme]);
  const addCustomPreset = React.useCallback((title: string, settings: MantineThemeSettings) => { const id = makeId(title); setCustomMap((previous) => ({ ...previous, [id]: { id, title: title.trim(), source: "custom", settings } })); return id; }, [setCustomMap]);
  const updateCustomPreset = React.useCallback((id: MantineThemePresetId, patch: { title?: string; settings?: Partial<MantineThemeSettings> }) => { if (!id.startsWith("custom:")) return; setCustomMap((previous) => { const current = previous[id]; return current ? { ...previous, [id]: { ...current, title: patch.title?.trim() || current.title, settings: { ...current.settings, ...patch.settings } } } : previous; }); }, [setCustomMap]);
  const removeCustomPreset = React.useCallback((id: MantineThemePresetId) => { if (!id.startsWith("custom:")) return; setCustomMap((previous) => { const next = { ...previous }; delete next[id]; return next; }); if (presetId === id) setPresetId(defaultPresetId); }, [defaultPresetId, presetId, setCustomMap, setPresetId]);
  const getCustomPreset = React.useCallback((id: MantineThemePresetId) => customMap[id], [customMap]);
  const contextValue = React.useMemo<MantineThemePresetContextValue>(() => ({ presetId, setPresetId, presets, customPresets, addCustomPreset, updateCustomPreset, removeCustomPreset, getCustomPreset }), [addCustomPreset, customPresets, getCustomPreset, presetId, presets, removeCustomPreset, setPresetId, updateCustomPreset]);

  return (
    <ThemeContext.Provider value={mantineTheme}>
      <MantineProvider theme={resolvedTheme} defaultColorScheme={colorScheme} forceColorScheme={colorScheme}>
        <MantineThemePresetContext.Provider value={contextValue}>
          <ModalsProvider>
            <Notifications />
            {children}
          </ModalsProvider>
        </MantineThemePresetContext.Provider>
      </MantineProvider>
    </ThemeContext.Provider>
  );
};

