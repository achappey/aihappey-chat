import * as React from "react";
import type { ChakraStoredCustomPreset, ChakraThemePreset, ChakraThemePresetId, ChakraThemeSettings } from "./chakraThemePresets";

export type ChakraThemePresetContextValue = {
  presetId: ChakraThemePresetId; setPresetId: (id: ChakraThemePresetId) => void; presets: Record<string, ChakraThemePreset>; customPresets: ChakraStoredCustomPreset[];
  addCustomPreset: (title: string, settings: ChakraThemeSettings) => ChakraThemePresetId;
  updateCustomPreset: (id: ChakraThemePresetId, patch: { title?: string; settings?: Partial<ChakraThemeSettings> }) => void;
  removeCustomPreset: (id: ChakraThemePresetId) => void; getCustomPreset: (id: ChakraThemePresetId) => ChakraStoredCustomPreset | undefined;
};
export const ChakraThemePresetContext = React.createContext<ChakraThemePresetContextValue | undefined>(undefined);
export function useChakraThemePreset() { const context = React.useContext(ChakraThemePresetContext); if (!context) throw new Error("useChakraThemePreset must be used within <ThemeProvider />"); return context; }

