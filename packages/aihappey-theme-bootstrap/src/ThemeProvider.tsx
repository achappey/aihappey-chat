import { ThemeContext } from "aihappey-components";
import { bootstrapTheme } from "./primitives";
import { bootstrapThemeStyles } from "./styles";
import { useCallback, useEffect, useMemo, type ReactNode } from "react";
import { useDarkMode, useLocalStorage } from "usehooks-ts";
import { BootstrapThemePresetContext, type BootstrapThemePresetContextValue } from "./BootstrapThemeContext";
import { BOOTSTRAP_BUILT_IN_PRESETS, bootstrapPresetCssVariables, type BootstrapStoredCustomPreset, type BootstrapThemePreset, type BootstrapThemePresetId, type BootstrapThemeSettings, type BootstrapThemeVariables } from "./bootstrapThemePresets";

export type BootstrapThemeProviderProps = {
  children: ReactNode;
  variables?: BootstrapThemeVariables;
  presets?: Record<string, BootstrapThemePreset>;
  defaultPresetId?: BootstrapThemePresetId;
  presetId?: BootstrapThemePresetId;
  onPresetChange?: (id: BootstrapThemePresetId) => void;
  persistKey?: string;
};

const CUSTOM_PRESETS_KEY = "bootstrap-custom-theme-presets";
const makeId = (title: string) => `custom:${title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40) || "theme"}-${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(16).slice(2, 10)}`;

export const ThemeProvider = ({ children, variables = {}, presets: appPresets = {}, defaultPresetId = "bootstrap:default", presetId: controlledPresetId, onPresetChange, persistKey = "bootstrap-theme-preset" }: BootstrapThemeProviderProps) => {
  const { isDarkMode } = useDarkMode();
  const systemColorMode = isDarkMode ? "dark" : "light";
  const [storedPresetId, setStoredPresetId] = useLocalStorage<BootstrapThemePresetId>(persistKey, defaultPresetId);
  const [customMap, setCustomMap] = useLocalStorage<Record<string, BootstrapStoredCustomPreset>>(CUSTOM_PRESETS_KEY, {});
  const customPresets = useMemo(() => Object.values(customMap).filter((preset) => preset?.id && preset?.settings).sort((a, b) => a.title.localeCompare(b.title)), [customMap]);
  const presets = useMemo(() => ({ ...BOOTSTRAP_BUILT_IN_PRESETS, ...appPresets, ...Object.fromEntries(customPresets.map((preset) => [preset.id, preset])) }), [appPresets, customPresets]);
  const requestedPresetId = controlledPresetId ?? storedPresetId;
  const presetId = presets[requestedPresetId] ? requestedPresetId : (presets[defaultPresetId] ? defaultPresetId : Object.keys(presets)[0]);
  const setPresetId = useCallback((id: BootstrapThemePresetId) => { if (!presets[id]) return; onPresetChange?.(id); if (controlledPresetId === undefined) setStoredPresetId(id); }, [controlledPresetId, onPresetChange, presets, setStoredPresetId]);
  const activePreset = presets[presetId] ?? BOOTSTRAP_BUILT_IN_PRESETS["bootstrap:default"];
  const colorMode = activePreset.settings.colorMode === "system" ? systemColorMode : activePreset.settings.colorMode;
  const resolvedVariables = useMemo(() => ({ ...variables, ...bootstrapPresetCssVariables(activePreset) }), [activePreset, variables]);
  const addCustomPreset = useCallback((title: string, settings: BootstrapThemeSettings) => { const id = makeId(title); setCustomMap((previous) => ({ ...previous, [id]: { id, title: title.trim(), source: "custom", settings } })); return id; }, [setCustomMap]);
  const updateCustomPreset = useCallback((id: BootstrapThemePresetId, patch: { title?: string; settings?: Partial<BootstrapThemeSettings> }) => { if (!id.startsWith("custom:")) return; setCustomMap((previous) => { const current = previous[id]; return current ? { ...previous, [id]: { ...current, title: patch.title?.trim() || current.title, settings: { ...current.settings, ...patch.settings } } } : previous; }); }, [setCustomMap]);
  const removeCustomPreset = useCallback((id: BootstrapThemePresetId) => { if (!id.startsWith("custom:")) return; setCustomMap((previous) => { const next = { ...previous }; delete next[id]; return next; }); if (presetId === id) setPresetId(defaultPresetId); }, [defaultPresetId, presetId, setCustomMap, setPresetId]);
  const getCustomPreset = useCallback((id: BootstrapThemePresetId) => customMap[id], [customMap]);
  const contextValue = useMemo<BootstrapThemePresetContextValue>(() => ({ presetId, setPresetId, presets, customPresets, addCustomPreset, updateCustomPreset, removeCustomPreset, getCustomPreset }), [addCustomPreset, customPresets, getCustomPreset, presetId, presets, removeCustomPreset, setPresetId, updateCustomPreset]);

  useEffect(() => {
    const root = document.documentElement;
    const previousTheme = root.getAttribute("data-bs-theme");

    root.setAttribute("data-bs-theme", colorMode);

    return () => {
      if (previousTheme) {
        root.setAttribute("data-bs-theme", previousTheme);
      } else {
        root.removeAttribute("data-bs-theme");
      }
    };
  }, [colorMode]);
   
  return (
    <ThemeContext.Provider value={bootstrapTheme}>
      <BootstrapThemePresetContext.Provider value={contextValue}>
        <div data-bs-theme={colorMode} className="aih-bootstrap-theme min-vh-100 bg-body text-body" style={resolvedVariables as React.CSSProperties}>
          <style>{bootstrapThemeStyles}</style>
          {children}
        </div>
      </BootstrapThemePresetContext.Provider>
    </ThemeContext.Provider>
  );
}
