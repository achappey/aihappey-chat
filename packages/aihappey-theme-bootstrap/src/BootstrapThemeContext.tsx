import * as React from "react";
import type { BootstrapStoredCustomPreset, BootstrapThemePreset, BootstrapThemePresetId, BootstrapThemeSettings } from "./bootstrapThemePresets";

export type BootstrapThemePresetContextValue = {
  presetId: BootstrapThemePresetId;
  setPresetId: (id: BootstrapThemePresetId) => void;
  presets: Record<string, BootstrapThemePreset>;
  customPresets: BootstrapStoredCustomPreset[];
  addCustomPreset: (title: string, settings: BootstrapThemeSettings) => BootstrapThemePresetId;
  updateCustomPreset: (id: BootstrapThemePresetId, patch: { title?: string; settings?: Partial<BootstrapThemeSettings> }) => void;
  removeCustomPreset: (id: BootstrapThemePresetId) => void;
  getCustomPreset: (id: BootstrapThemePresetId) => BootstrapStoredCustomPreset | undefined;
};

export const BootstrapThemePresetContext = React.createContext<BootstrapThemePresetContextValue | undefined>(undefined);
export function useBootstrapThemePreset() {
  const context = React.useContext(BootstrapThemePresetContext);
  if (!context) throw new Error("useBootstrapThemePreset must be used within <ThemeProvider />");
  return context;
}

