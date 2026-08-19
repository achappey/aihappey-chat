import type { MantineColorShade, MantineThemeOverride } from "@mantine/core";

export type MantineThemePresetId = string;
export type MantineRadius = "xs" | "sm" | "md" | "lg" | "xl";

export type MantineThemeSettings = {
  primaryColor: MantineBuiltInColor;
  primaryShadeLight: MantineColorShade;
  primaryShadeDark: MantineColorShade;
  defaultRadius: MantineRadius;
  scale: number;
  focusRing: "auto" | "always";
  cursorType: "default" | "pointer";
  autoContrast: boolean;
  luminanceThreshold: number;
  fontSmoothing: boolean;
};

export type MantineThemePreset = {
  id: MantineThemePresetId;
  title: string;
  description?: string;
  source?: "built-in" | "app" | "custom";
  settings: MantineThemeSettings;
};

export type MantineStoredCustomPreset = MantineThemePreset & { source: "custom" };

export const MANTINE_BUILT_IN_COLORS = ["dark", "gray", "red", "pink", "grape", "violet", "indigo", "blue", "cyan", "teal", "green", "lime", "yellow", "orange"] as const;
export type MantineBuiltInColor = (typeof MANTINE_BUILT_IN_COLORS)[number];

export const MANTINE_BUILT_IN_PRESETS: Record<string, MantineThemePreset> = {
  "mantine:default": { id: "mantine:default", title: "Framework default", description: "No user overrides. Uses Mantine defaults and the app theme unchanged.", source: "built-in", settings: { primaryColor: "blue", primaryShadeLight: 6, primaryShadeDark: 8, defaultRadius: "sm", scale: 1, focusRing: "auto", cursorType: "default", autoContrast: false, luminanceThreshold: 0.3, fontSmoothing: true } },
  "mantine:product": { id: "mantine:product", title: "Product UI", description: "Pointer cursors, keyboard-aware focus, indigo primary shades, and compact scale.", source: "built-in", settings: { primaryColor: "indigo", primaryShadeLight: 6, primaryShadeDark: 7, defaultRadius: "sm", scale: 0.94, focusRing: "auto", cursorType: "pointer", autoContrast: true, luminanceThreshold: 0.3, fontSmoothing: true } },
  "mantine:accessible": { id: "mantine:accessible", title: "Visible focus", description: "Always-visible focus rings and automatic filled-control contrast.", source: "built-in", settings: { primaryColor: "blue", primaryShadeLight: 7, primaryShadeDark: 5, defaultRadius: "md", scale: 1, focusRing: "always", cursorType: "pointer", autoContrast: true, luminanceThreshold: 0.42, fontSmoothing: true } },
  "mantine:soft": { id: "mantine:soft", title: "Soft content", description: "Teal accents, larger scale, and soft default radius for content-focused screens.", source: "built-in", settings: { primaryColor: "teal", primaryShadeLight: 6, primaryShadeDark: 4, defaultRadius: "lg", scale: 1.06, focusRing: "auto", cursorType: "default", autoContrast: false, luminanceThreshold: 0.3, fontSmoothing: true } },
};

export function mantinePresetOverride(preset: MantineThemePreset): MantineThemeOverride {
  if (preset.id === "mantine:default") return {};
  return {
    primaryColor: preset.settings.primaryColor,
    primaryShade: { light: preset.settings.primaryShadeLight, dark: preset.settings.primaryShadeDark },
    defaultRadius: preset.settings.defaultRadius,
    scale: preset.settings.scale,
    focusRing: preset.settings.focusRing,
    cursorType: preset.settings.cursorType,
    autoContrast: preset.settings.autoContrast,
    luminanceThreshold: preset.settings.luminanceThreshold,
    fontSmoothing: preset.settings.fontSmoothing,
  };
}

