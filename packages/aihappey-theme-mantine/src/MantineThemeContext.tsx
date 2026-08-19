import * as React from "react";
import type { MantineStoredCustomPreset, MantineThemePreset, MantineThemePresetId, MantineThemeSettings } from "./mantineThemePresets";

export type MantineThemePresetContextValue = {
  presetId: MantineThemePresetId;
  setPresetId: (id: MantineThemePresetId) => void;
  presets: Record<string, MantineThemePreset>;
  customPresets: MantineStoredCustomPreset[];
  addCustomPreset: (title: string, settings: MantineThemeSettings) => MantineThemePresetId;
  updateCustomPreset: (id: MantineThemePresetId, patch: { title?: string; settings?: Partial<MantineThemeSettings> }) => void;
  removeCustomPreset: (id: MantineThemePresetId) => void;
  getCustomPreset: (id: MantineThemePresetId) => MantineStoredCustomPreset | undefined;
};

export const MantineThemePresetContext = React.createContext<MantineThemePresetContextValue | undefined>(undefined);

export function useMantineThemePreset() {
  const context = React.useContext(MantineThemePresetContext);
  if (!context) throw new Error("useMantineThemePreset must be used within <ThemeProvider />");
  return context;
}

