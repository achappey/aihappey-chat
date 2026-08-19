import type { SystemConfig } from "@chakra-ui/react";

export type ChakraThemePresetId = string;
export const CHAKRA_COLOR_PALETTES = ["gray", "red", "orange", "yellow", "green", "teal", "blue", "cyan", "purple", "pink"] as const;
export type ChakraColorPalette = (typeof CHAKRA_COLOR_PALETTES)[number];
export type ChakraRadiusProfile = "chakra" | "sharp" | "soft" | "rounded";
export type ChakraThemeSettings = { colorPalette: ChakraColorPalette; radiusProfile: ChakraRadiusProfile; fontFamily: string };
export type ChakraThemePreset = { id: ChakraThemePresetId; title: string; description?: string; source?: "built-in" | "app" | "custom"; settings: ChakraThemeSettings };
export type ChakraStoredCustomPreset = ChakraThemePreset & { source: "custom" };

export const CHAKRA_FONT_FAMILIES = [
  "system-ui, sans-serif",
  "Inter, system-ui, sans-serif",
  "Arial, Helvetica, sans-serif",
  "Georgia, 'Times New Roman', serif",
] as const;

export const CHAKRA_COLOR_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

export const CHAKRA_BUILT_IN_PRESETS: Record<string, ChakraThemePreset> = {
  "chakra:default": { id: "chakra:default", title: "Framework default", description: "No user token overrides. Uses the supplied Chakra system unchanged.", source: "built-in", settings: { colorPalette: "gray", radiusProfile: "chakra", fontFamily: CHAKRA_FONT_FAMILIES[0] } },
  "chakra:oceanic": { id: "chakra:oceanic", title: "Oceanic system", description: "Chakra's teal colorPalette with a soft radius token profile.", source: "built-in", settings: { colorPalette: "teal", radiusProfile: "soft", fontFamily: CHAKRA_FONT_FAMILIES[0] } },
  "chakra:monochrome": { id: "chakra:monochrome", title: "Monochrome system", description: "The neutral gray colorPalette with a sharp token profile.", source: "built-in", settings: { colorPalette: "gray", radiusProfile: "sharp", fontFamily: CHAKRA_FONT_FAMILIES[0] } },
  "chakra:playful": { id: "chakra:playful", title: "Playful system", description: "Chakra's pink colorPalette and rounded radius tokens.", source: "built-in", settings: { colorPalette: "pink", radiusProfile: "rounded", fontFamily: CHAKRA_FONT_FAMILIES[1] } },
};

const RADIUS_PROFILES: Record<ChakraRadiusProfile, Record<string, string>> = {
  chakra: { xs: "0.125rem", sm: "0.25rem", md: "0.375rem", lg: "0.5rem", xl: "0.75rem", "2xl": "1rem" },
  sharp: { xs: "0", sm: "0", md: "0.125rem", lg: "0.25rem", xl: "0.375rem", "2xl": "0.5rem" },
  soft: { xs: "0.25rem", sm: "0.375rem", md: "0.5rem", lg: "0.75rem", xl: "1rem", "2xl": "1.25rem" },
  rounded: { xs: "0.375rem", sm: "0.5rem", md: "0.75rem", lg: "1rem", xl: "1.5rem", "2xl": "2rem" },
};

export function chakraPresetSystemConfig(preset: ChakraThemePreset): SystemConfig {
  if (preset.id === "chakra:default") return {};
  const radii = RADIUS_PROFILES[preset.settings.radiusProfile];
  return {
    theme: {
      tokens: {
        fonts: { body: { value: preset.settings.fontFamily }, heading: { value: preset.settings.fontFamily } },
        radii: Object.fromEntries(Object.entries(radii).map(([key, value]) => [key, { value }])),
      },
    },
  };
}

