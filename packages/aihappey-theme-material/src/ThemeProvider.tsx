import * as React from "react";
import { ThemeContext } from "aihappey-components";
import { Box, ScopedCssBaseline, ThemeProvider as MuiThemeProvider, createTheme, type ThemeOptions } from "@mui/material";
import { useDarkMode, useLocalStorage } from "usehooks-ts";
import { materialTheme } from "./primitives";
import { MaterialThemePresetContext, type MaterialThemePresetContextValue } from "./MaterialThemeContext";
import {
  MATERIAL_BUILT_IN_PRESETS,
  materialPresetThemeOptions,
  type MaterialStoredCustomPreset,
  type MaterialThemePreset,
  type MaterialThemePresetId,
  type MaterialThemeSettings,
} from "./materialThemePresets";

export type MaterialThemeProviderProps = {
  children: React.ReactNode;
  theme?: ThemeOptions;
  defaultColorScheme?: "light" | "dark" | "auto";
  presets?: Record<string, MaterialThemePreset>;
  defaultPresetId?: MaterialThemePresetId;
  presetId?: MaterialThemePresetId;
  onPresetChange?: (id: MaterialThemePresetId) => void;
  persistKey?: string;
};

const CUSTOM_PRESETS_KEY = "material-custom-theme-presets";

function makeId(title: string): MaterialThemePresetId {
  const slug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40) || "theme";
  const suffix = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(16).slice(2, 10);
  return `custom:${slug}-${suffix}`;
}

export const ThemeProvider = ({
  children,
  theme,
  defaultColorScheme = "auto",
  presets: appPresets = {},
  defaultPresetId = "material:default",
  presetId: controlledPresetId,
  onPresetChange,
  persistKey = "material-theme-preset",
}: MaterialThemeProviderProps) => {
  const { isDarkMode } = useDarkMode();
  const mode = defaultColorScheme === "auto" ? (isDarkMode ? "dark" : "light") : defaultColorScheme;
  const [storedPresetId, setStoredPresetId] = useLocalStorage<MaterialThemePresetId>(persistKey, defaultPresetId);
  const [customMap, setCustomMap] = useLocalStorage<Record<string, MaterialStoredCustomPreset>>(CUSTOM_PRESETS_KEY, {});
  const customPresets = React.useMemo(
    () => Object.values(customMap).filter((preset) => preset?.id && preset?.settings).sort((a, b) => a.title.localeCompare(b.title)),
    [customMap]
  );
  const presets = React.useMemo(() => {
    const customEntries = Object.fromEntries(customPresets.map((preset) => [preset.id, preset]));
    return { ...MATERIAL_BUILT_IN_PRESETS, ...appPresets, ...customEntries };
  }, [appPresets, customPresets]);
  const requestedPresetId = controlledPresetId ?? storedPresetId;
  const presetId = presets[requestedPresetId] ? requestedPresetId : (presets[defaultPresetId] ? defaultPresetId : Object.keys(presets)[0]);
  const setPresetId = React.useCallback((id: MaterialThemePresetId) => {
    if (!presets[id]) return;
    onPresetChange?.(id);
    if (controlledPresetId === undefined) setStoredPresetId(id);
  }, [controlledPresetId, onPresetChange, presets, setStoredPresetId]);
  const activePreset = presets[presetId] ?? MATERIAL_BUILT_IN_PRESETS["material:default"];
  const muiTheme = React.useMemo(
    () => createTheme({ palette: { mode }, ...(theme ?? {}) }, materialPresetThemeOptions(activePreset)),
    [activePreset, mode, theme]
  );

  const addCustomPreset = React.useCallback((title: string, settings: MaterialThemeSettings) => {
    const id = makeId(title);
    const preset: MaterialStoredCustomPreset = { id, title: title.trim(), source: "custom", settings };
    setCustomMap((previous) => ({ ...previous, [id]: preset }));
    return id;
  }, [setCustomMap]);
  const updateCustomPreset = React.useCallback((id: MaterialThemePresetId, patch: { title?: string; settings?: Partial<MaterialThemeSettings> }) => {
    if (!id.startsWith("custom:")) return;
    setCustomMap((previous) => {
      const current = previous[id];
      if (!current) return previous;
      return { ...previous, [id]: { ...current, title: patch.title?.trim() || current.title, settings: { ...current.settings, ...patch.settings } } };
    });
  }, [setCustomMap]);
  const removeCustomPreset = React.useCallback((id: MaterialThemePresetId) => {
    if (!id.startsWith("custom:")) return;
    setCustomMap((previous) => {
      const next = { ...previous };
      delete next[id];
      return next;
    });
    if (presetId === id) setPresetId(defaultPresetId);
  }, [defaultPresetId, presetId, setCustomMap, setPresetId]);
  const getCustomPreset = React.useCallback((id: MaterialThemePresetId) => customMap[id], [customMap]);
  const contextValue = React.useMemo<MaterialThemePresetContextValue>(() => ({
    presetId, setPresetId, presets, customPresets, addCustomPreset, updateCustomPreset, removeCustomPreset, getCustomPreset,
  }), [addCustomPreset, customPresets, getCustomPreset, presetId, presets, removeCustomPreset, setPresetId, updateCustomPreset]);

  React.useEffect(() => {
    const root = document.documentElement;
    const previousTheme = root.getAttribute("data-material-theme");
    root.setAttribute("data-material-theme", mode);
    return () => {
      if (previousTheme) root.setAttribute("data-material-theme", previousTheme);
      else root.removeAttribute("data-material-theme");
    };
  }, [mode]);

  return (
    <ThemeContext.Provider value={materialTheme}>
      <MuiThemeProvider theme={muiTheme}>
        <MaterialThemePresetContext.Provider value={contextValue}>
          <ScopedCssBaseline enableColorScheme>
            <Box className="aih-material-theme" sx={{ minHeight: "100vh", bgcolor: "background.default", color: "text.primary" }}>
              {children}
            </Box>
          </ScopedCssBaseline>
        </MaterialThemePresetContext.Provider>
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

