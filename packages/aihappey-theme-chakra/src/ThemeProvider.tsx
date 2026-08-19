import * as React from "react";
import { Box, ChakraProvider, createSystem, defaultSystem, type SystemContext } from "@chakra-ui/react";
import { useDarkMode, useLocalStorage } from "usehooks-ts";
import { ThemeContext } from "aihappey-components";
import { chakraTheme } from "./primitives";
import { ChakraThemePresetContext, type ChakraThemePresetContextValue } from "./ChakraThemeContext";
import { CHAKRA_BUILT_IN_PRESETS, chakraPresetSystemConfig, type ChakraStoredCustomPreset, type ChakraThemePreset, type ChakraThemePresetId, type ChakraThemeSettings } from "./chakraThemePresets";

export type ChakraThemeProviderProps = {
  children: React.ReactNode;
  system?: SystemContext;
  defaultColorScheme?: "light" | "dark" | "auto";
  presets?: Record<string, ChakraThemePreset>;
  defaultPresetId?: ChakraThemePresetId;
  presetId?: ChakraThemePresetId;
  onPresetChange?: (id: ChakraThemePresetId) => void;
  persistKey?: string;
};

const CUSTOM_PRESETS_KEY = "chakra-custom-theme-presets";
const makeId = (title: string) => `custom:${title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40) || "theme"}-${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(16).slice(2, 10)}`;

export const ThemeProvider = ({ children, system = defaultSystem, defaultColorScheme = "auto", presets: appPresets = {}, defaultPresetId = "chakra:default", presetId: controlledPresetId, onPresetChange, persistKey = "chakra-theme-preset" }: ChakraThemeProviderProps) => {
  const { isDarkMode } = useDarkMode();
  const colorScheme = defaultColorScheme === "auto" ? (isDarkMode ? "dark" : "light") : defaultColorScheme;
  const [storedPresetId, setStoredPresetId] = useLocalStorage<ChakraThemePresetId>(persistKey, defaultPresetId);
  const [customMap, setCustomMap] = useLocalStorage<Record<string, ChakraStoredCustomPreset>>(CUSTOM_PRESETS_KEY, {});
  const customPresets = React.useMemo(() => Object.values(customMap).filter((preset) => preset?.id && preset?.settings).sort((a, b) => a.title.localeCompare(b.title)), [customMap]);
  const presets = React.useMemo(() => ({ ...CHAKRA_BUILT_IN_PRESETS, ...appPresets, ...Object.fromEntries(customPresets.map((preset) => [preset.id, preset])) }), [appPresets, customPresets]);
  const requestedPresetId = controlledPresetId ?? storedPresetId;
  const presetId = presets[requestedPresetId] ? requestedPresetId : (presets[defaultPresetId] ? defaultPresetId : Object.keys(presets)[0]);
  const setPresetId = React.useCallback((id: ChakraThemePresetId) => { if (!presets[id]) return; onPresetChange?.(id); if (controlledPresetId === undefined) setStoredPresetId(id); }, [controlledPresetId, onPresetChange, presets, setStoredPresetId]);
  const activePreset = presets[presetId] ?? CHAKRA_BUILT_IN_PRESETS["chakra:default"];
  const resolvedSystem = React.useMemo(() => createSystem(system._config, chakraPresetSystemConfig(activePreset)), [activePreset, system]);
  const addCustomPreset = React.useCallback((title: string, settings: ChakraThemeSettings) => { const id = makeId(title); setCustomMap((previous) => ({ ...previous, [id]: { id, title: title.trim(), source: "custom", settings } })); return id; }, [setCustomMap]);
  const updateCustomPreset = React.useCallback((id: ChakraThemePresetId, patch: { title?: string; settings?: Partial<ChakraThemeSettings> }) => { if (!id.startsWith("custom:")) return; setCustomMap((previous) => { const current = previous[id]; return current ? { ...previous, [id]: { ...current, title: patch.title?.trim() || current.title, settings: { ...current.settings, ...patch.settings } } } : previous; }); }, [setCustomMap]);
  const removeCustomPreset = React.useCallback((id: ChakraThemePresetId) => { if (!id.startsWith("custom:")) return; setCustomMap((previous) => { const next = { ...previous }; delete next[id]; return next; }); if (presetId === id) setPresetId(defaultPresetId); }, [defaultPresetId, presetId, setCustomMap, setPresetId]);
  const getCustomPreset = React.useCallback((id: ChakraThemePresetId) => customMap[id], [customMap]);
  const contextValue = React.useMemo<ChakraThemePresetContextValue>(() => ({ presetId, setPresetId, presets, customPresets, addCustomPreset, updateCustomPreset, removeCustomPreset, getCustomPreset }), [addCustomPreset, customPresets, getCustomPreset, presetId, presets, removeCustomPreset, setPresetId, updateCustomPreset]);

  React.useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const previousTheme = root.getAttribute("data-theme");
    const previousColorMode = root.getAttribute("data-color-mode");
    const previousRootClassName = root.className;
    const previousBodyBackground = body.style.backgroundColor;
    const previousBodyColor = body.style.color;
    root.setAttribute("data-theme", colorScheme);
    root.setAttribute("data-color-mode", colorScheme);
    root.classList.toggle("dark", colorScheme === "dark");
    root.classList.toggle("light", colorScheme === "light");
    body.style.backgroundColor = colorScheme === "dark" ? "var(--chakra-colors-bg)" : previousBodyBackground;
    body.style.color = colorScheme === "dark" ? "var(--chakra-colors-fg)" : previousBodyColor;

    return () => {
      if (previousTheme) root.setAttribute("data-theme", previousTheme);
      else root.removeAttribute("data-theme");
      if (previousColorMode) root.setAttribute("data-color-mode", previousColorMode);
      else root.removeAttribute("data-color-mode");
      root.className = previousRootClassName;
      body.style.backgroundColor = previousBodyBackground;
      body.style.color = previousBodyColor;
    };
  }, [colorScheme]);

  return (
    <ThemeContext.Provider value={chakraTheme}>
      <ChakraProvider value={resolvedSystem}>
        <ChakraThemePresetContext.Provider value={contextValue}>
          <Box colorPalette={activePreset.id === "chakra:default" ? undefined : activePreset.settings.colorPalette} className={`chakra-theme ${colorScheme}`} minHeight="100vh" background="bg" color="fg">
            {children}
          </Box>
        </ChakraThemePresetContext.Provider>
      </ChakraProvider>
    </ThemeContext.Provider>
  );
};
