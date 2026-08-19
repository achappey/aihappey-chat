import type { ThemeOptions } from "@mui/material/styles";
import { amber, blue, cyan, deepOrange, deepPurple, green, indigo, pink, purple, red, teal } from "@mui/material/colors";

export type MaterialThemePresetId = string;

export type MaterialThemeSettings = {
  primaryPalette: MaterialPaletteName;
  secondaryPalette: MaterialPaletteName;
  contrastThreshold: number;
  tonalOffset: number;
  borderRadius: number;
  fontFamily: string;
  density: "comfortable" | "compact";
};

export type MaterialPaletteName = keyof typeof MATERIAL_PALETTES;

export type MaterialThemePreset = {
  id: MaterialThemePresetId;
  title: string;
  description?: string;
  source?: "built-in" | "app" | "custom";
  settings: MaterialThemeSettings;
};

export type MaterialStoredCustomPreset = MaterialThemePreset & {
  source: "custom";
};

export const MATERIAL_FONT_FAMILIES = [
  "Roboto, Helvetica, Arial, sans-serif",
  "Inter, system-ui, sans-serif",
  "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  "Georgia, 'Times New Roman', serif",
] as const;

export const MATERIAL_PALETTES = { blue, indigo, deepPurple, purple, pink, red, deepOrange, amber, green, teal, cyan } as const;

export const MATERIAL_BUILT_IN_PRESETS: Record<string, MaterialThemePreset> = {
  "material:default": {
    id: "material:default",
    title: "Framework default",
    description: "No user overrides. Uses Material defaults and the app-supplied theme unchanged.",
    source: "built-in",
    settings: { primaryPalette: "blue", secondaryPalette: "purple", contrastThreshold: 3, tonalOffset: 0.2, borderRadius: 4, fontFamily: MATERIAL_FONT_FAMILIES[0], density: "comfortable" },
  },
  "material:baseline": {
    id: "material:baseline",
    title: "Material baseline",
    description: "Classic Material palette, typography, shape, and comfortable component defaults.",
    source: "built-in",
    settings: { primaryPalette: "blue", secondaryPalette: "purple", contrastThreshold: 3, tonalOffset: 0.2, borderRadius: 4, fontFamily: MATERIAL_FONT_FAMILIES[0], density: "comfortable" },
  },
  "material:expressive": {
    id: "material:expressive",
    title: "Expressive",
    description: "A more expressive Material setup with stronger tonal separation and generous shape.",
    source: "built-in",
    settings: { primaryPalette: "deepPurple", secondaryPalette: "cyan", contrastThreshold: 4.5, tonalOffset: 0.3, borderRadius: 16, fontFamily: MATERIAL_FONT_FAMILIES[1], density: "comfortable" },
  },
  "material:dense": {
    id: "material:dense",
    title: "Dense dashboard",
    description: "Compact Material component defaults for information-dense interfaces.",
    source: "built-in",
    settings: { primaryPalette: "indigo", secondaryPalette: "deepOrange", contrastThreshold: 3, tonalOffset: 0.2, borderRadius: 2, fontFamily: MATERIAL_FONT_FAMILIES[0], density: "compact" },
  },
};

export function materialPresetThemeOptions(preset: MaterialThemePreset): ThemeOptions {
  if (preset.id === "material:default") return {};
  const settings = preset.settings;
  return {
    palette: {
      primary: MATERIAL_PALETTES[settings.primaryPalette],
      secondary: MATERIAL_PALETTES[settings.secondaryPalette],
      contrastThreshold: settings.contrastThreshold,
      tonalOffset: settings.tonalOffset,
    },
    shape: { borderRadius: settings.borderRadius },
    typography: { fontFamily: settings.fontFamily },
    components: settings.density === "compact" ? {
      MuiButton: { defaultProps: { size: "small" } },
      MuiTextField: { defaultProps: { size: "small", margin: "dense" } },
      MuiFormControl: { defaultProps: { size: "small", margin: "dense" } },
      MuiTable: { defaultProps: { size: "small" } },
    } : {},
  };
}

