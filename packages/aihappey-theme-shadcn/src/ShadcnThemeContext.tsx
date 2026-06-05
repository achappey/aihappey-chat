import * as React from "react";
import type {
  ShadcnStoredCustomPreset,
  ShadcnThemePreset,
  ShadcnThemePresetId,
} from "./shadcnThemeTokens";

export type ShadcnThemePresetMap = Record<string, ShadcnThemePreset>;

export type ShadcnThemePresetContextValue = {
  presetId: ShadcnThemePresetId;
  setPresetId: (id: ShadcnThemePresetId) => void;
  presets: ShadcnThemePresetMap;
  customPresets: ShadcnStoredCustomPreset[];
  addCustomPreset: (title: string, baseHex: string, radius?: string) => ShadcnThemePresetId;
  updateCustomPreset: (
    id: ShadcnThemePresetId,
    patch: Partial<Pick<ShadcnStoredCustomPreset, "title" | "baseHex" | "radius">>
  ) => void;
  removeCustomPreset: (id: ShadcnThemePresetId) => void;
  getCustomPreset: (id: ShadcnThemePresetId) => ShadcnStoredCustomPreset | undefined;
};

export const ShadcnThemePresetContext = React.createContext<ShadcnThemePresetContextValue | undefined>(undefined);

export function useShadcnThemePreset() {
  const context = React.useContext(ShadcnThemePresetContext);
  if (!context) {
    throw new Error("useShadcnThemePreset must be used within <ThemeProvider />");
  }
  return context;
}

