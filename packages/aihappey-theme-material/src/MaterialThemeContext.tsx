import * as React from "react";
import type { MaterialStoredCustomPreset, MaterialThemePreset, MaterialThemePresetId, MaterialThemeSettings } from "./materialThemePresets";

export type MaterialThemePresetContextValue = {
  presetId: MaterialThemePresetId;
  setPresetId: (id: MaterialThemePresetId) => void;
  presets: Record<string, MaterialThemePreset>;
  customPresets: MaterialStoredCustomPreset[];
  addCustomPreset: (title: string, settings: MaterialThemeSettings) => MaterialThemePresetId;
  updateCustomPreset: (id: MaterialThemePresetId, patch: { title?: string; settings?: Partial<MaterialThemeSettings> }) => void;
  removeCustomPreset: (id: MaterialThemePresetId) => void;
  getCustomPreset: (id: MaterialThemePresetId) => MaterialStoredCustomPreset | undefined;
};

export const MaterialThemePresetContext = React.createContext<MaterialThemePresetContextValue | undefined>(undefined);

export function useMaterialThemePreset() {
  const context = React.useContext(MaterialThemePresetContext);
  if (!context) throw new Error("useMaterialThemePreset must be used within <ThemeProvider />");
  return context;
}

