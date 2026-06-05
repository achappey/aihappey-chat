import colors from "tailwindcss/colors";

export type ShadcnThemePresetId =
  | "default"
  | `tailwind:${string}`
  | `scheme:${string}`
  | `custom:${string}`;

export type ShadcnColorStop = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;

export type ShadcnColorScale = Record<ShadcnColorStop, string>;

export type ShadcnThemeModeTokens = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  chatAssistant: string;
  chatAssistantForeground: string;
  chatAssistantBorder: string;
};

export type ShadcnThemeScheme = {
  light: Partial<ShadcnThemeModeTokens>;
  dark: Partial<ShadcnThemeModeTokens>;
  radius?: string;
  palette?: Partial<ShadcnColorScale>;
};

export type ShadcnThemePreset = {
  id: ShadcnThemePresetId;
  title: string;
  description?: string;
  source: "builtin" | "app" | "custom";
  scheme: ShadcnThemeScheme;
};

export type ShadcnCustomSchemeConfig = ShadcnThemeScheme & {
  title: string;
  description?: string;
};

export type ShadcnStoredCustomPreset = {
  id: ShadcnThemePresetId;
  title: string;
  baseHex: string;
  radius?: string;
};

export const SHADCN_COLOR_STOPS: ShadcnColorStop[] = [
  50,
  100,
  200,
  300,
  400,
  500,
  600,
  700,
  800,
  900,
  950,
];

export const DEFAULT_SHADCN_PRESET_ID: ShadcnThemePresetId = "tailwind:slate";

export const builtinTailwindPaletteNames = [
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
] as const;

type TailwindPaletteName = (typeof builtinTailwindPaletteNames)[number];

const fallbackDestructiveScale = normalizeScale((colors as any).red) ?? createScaleFromBaseColor("#ef4444");

function toTitle(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function cssVarName(tokenName: keyof ShadcnThemeModeTokens) {
  return tokenName.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeHex(value: string) {
  const raw = value.trim();
  const short = raw.match(/^#?([0-9a-f]{3})$/i)?.[1];
  if (short) return `#${short.split("").map((c) => c + c).join("")}`.toUpperCase();
  const long = raw.match(/^#?([0-9a-f]{6})$/i)?.[1];
  return long ? `#${long}`.toUpperCase() : undefined;
}

function parseHex(value: string) {
  const hex = normalizeHex(value);
  if (!hex) return undefined;
  const n = Number.parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((part) => clamp(Math.round(part), 0, 255).toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase();
}

function mix(hex: string, targetHex: string, amount: number) {
  const source = parseHex(hex) ?? parseHex("#000000")!;
  const target = parseHex(targetHex) ?? parseHex("#000000")!;
  return rgbToHex(
    source.r * (1 - amount) + target.r * amount,
    source.g * (1 - amount) + target.g * amount,
    source.b * (1 - amount) + target.b * amount
  );
}

export function isValidHexColor(value: string) {
  return !!normalizeHex(value);
}

export function normalizeColorValue(value: string) {
  const hex = normalizeHex(value);
  if (hex) return hex;
  return value.trim();
}

export function hexToCssHsl(value: string) {
  const rgb = parseHex(value);
  if (!rgb) return value.trim();

  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }

  return `hsl(${Math.round(h * 360)} ${Math.round(s * 1000) / 10}% ${Math.round(l * 1000) / 10}%)`;
}

export function readableTextColor(background: string) {
  const rgb = parseHex(background);
  if (!rgb) return "var(--aih-shadcn-foreground)";
  const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  return luminance > 0.55 ? "#111827" : "#F9FAFB";
}

export function createScaleFromBaseColor(baseHex: string): ShadcnColorScale {
  const base = normalizeHex(baseHex) ?? "#3B82F6";
  return {
    50: mix(base, "#FFFFFF", 0.95),
    100: mix(base, "#FFFFFF", 0.9),
    200: mix(base, "#FFFFFF", 0.76),
    300: mix(base, "#FFFFFF", 0.58),
    400: mix(base, "#FFFFFF", 0.32),
    500: base,
    600: mix(base, "#000000", 0.12),
    700: mix(base, "#000000", 0.28),
    800: mix(base, "#000000", 0.46),
    900: mix(base, "#000000", 0.62),
    950: mix(base, "#000000", 0.78),
  };
}

export function normalizeScale(scale: unknown): ShadcnColorScale | undefined {
  if (!scale || typeof scale !== "object") return undefined;
  const out: Partial<ShadcnColorScale> = {};
  for (const stop of SHADCN_COLOR_STOPS) {
    const value = (scale as Record<string, unknown>)[String(stop)];
    if (typeof value !== "string") return undefined;
    out[stop] = normalizeColorValue(value);
  }
  return out as ShadcnColorScale;
}

export function createSchemeFromScale(scale: ShadcnColorScale, radius = "0.5rem"): ShadcnThemeScheme {
  const destructive = fallbackDestructiveScale;
  return {
    radius,
    palette: scale,
    light: {
      background: scale[50],
      foreground: scale[950],
      card: mix(scale[50], scale[100], 0.55),
      cardForeground: scale[950],
      popover: "#FFFFFF",
      popoverForeground: scale[950],
      primary: scale[900],
      primaryForeground: scale[50],
      secondary: scale[100],
      secondaryForeground: scale[900],
      muted: scale[100],
      mutedForeground: scale[600],
      accent: scale[100],
      accentForeground: scale[900],
      destructive: destructive[600],
      destructiveForeground: destructive[50],
      border: scale[200],
      input: scale[200],
      ring: scale[500],
      chatAssistant: mix(scale[50], scale[100], 0.75),
      chatAssistantForeground: scale[950],
      chatAssistantBorder: scale[200],
    },
    dark: {
      background: scale[950],
      foreground: scale[50],
      card: scale[900],
      cardForeground: scale[50],
      popover: scale[950],
      popoverForeground: scale[50],
      primary: scale[200],
      primaryForeground: scale[950],
      secondary: scale[800],
      secondaryForeground: scale[50],
      muted: scale[800],
      mutedForeground: scale[300],
      accent: scale[800],
      accentForeground: scale[50],
      destructive: destructive[800],
      destructiveForeground: destructive[50],
      border: scale[800],
      input: scale[800],
      ring: scale[300],
      chatAssistant: mix(scale[950], scale[900], 0.45),
      chatAssistantForeground: scale[50],
      chatAssistantBorder: scale[800],
    },
  };
}

export function createSchemeFromBaseColor(baseHex: string, radius = "0.5rem") {
  return createSchemeFromScale(createScaleFromBaseColor(baseHex), radius);
}

export function buildBuiltinTailwindPresets(): Record<ShadcnThemePresetId, ShadcnThemePreset> {
  const presets: Record<string, ShadcnThemePreset> = {};
  for (const paletteName of builtinTailwindPaletteNames) {
    const scale = normalizeScale((colors as Record<TailwindPaletteName, unknown>)[paletteName]);
    if (!scale) continue;
    const id = `tailwind:${paletteName}` as const;
    presets[id] = {
      id,
      title: toTitle(paletteName),
      description: `Tailwind ${paletteName} palette`,
      source: "builtin",
      scheme: createSchemeFromScale(scale),
    };
  }
  return presets as Record<ShadcnThemePresetId, ShadcnThemePreset>;
}

export function buildAppSchemePresets(customSchemes?: Record<string, ShadcnCustomSchemeConfig>) {
  const presets: Record<string, ShadcnThemePreset> = {};
  for (const [name, scheme] of Object.entries(customSchemes ?? {})) {
    const id = `scheme:${name}` as const;
    presets[id] = {
      id,
      title: scheme.title ?? name,
      description: scheme.description,
      source: "app",
      scheme,
    };
  }
  return presets as Record<ShadcnThemePresetId, ShadcnThemePreset>;
}

export function createCustomPresetFromStored(stored: ShadcnStoredCustomPreset): ShadcnThemePreset {
  return {
    id: stored.id,
    title: stored.title,
    source: "custom",
    description: "Custom shadcn scheme",
    scheme: createSchemeFromBaseColor(stored.baseHex, stored.radius),
  };
}

function mergeModeTokens(tokens: Partial<ShadcnThemeModeTokens>) {
  return Object.entries(tokens)
    .map(([key, value]) => `  --aih-shadcn-${cssVarName(key as keyof ShadcnThemeModeTokens)}: ${hexToCssHsl(String(value))};`)
    .join("\n");
}

export function buildShadcnPresetStyles(preset: ShadcnThemePreset) {
  const radius = preset.scheme.radius ?? "0.5rem";
  return `
.aih-shadcn-theme,
.aih-shadcn-portal-root {
  --aih-shadcn-radius: ${radius};
${mergeModeTokens(preset.scheme.light)}
}

.aih-shadcn-theme.dark,
.dark .aih-shadcn-theme,
.aih-shadcn-portal-root.dark,
.dark .aih-shadcn-portal-root,
html[data-theme="dark"] .aih-shadcn-portal-root {
${mergeModeTokens(preset.scheme.dark)}
}`;
}

export function getPresetPalette(preset?: ShadcnThemePreset) {
  return preset?.scheme.palette;
}

