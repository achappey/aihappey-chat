export type BootstrapThemePresetId = string;

export type BootstrapThemeSettings = {
  colorMode: "system" | "light" | "dark";
  primaryColor: string;
  borderRadius: number;
  bodyFontSize: number;
  bodyLineHeight: number;
  borderWidth: number;
  focusRingOpacity: number;
};

export type BootstrapThemePreset = {
  id: BootstrapThemePresetId;
  title: string;
  description?: string;
  source?: "built-in" | "app" | "custom";
  settings: BootstrapThemeSettings;
};

export type BootstrapStoredCustomPreset = BootstrapThemePreset & { source: "custom" };
export type BootstrapThemeVariables = Record<`--${string}`, string | number>;

export const BOOTSTRAP_BUILT_IN_PRESETS: Record<string, BootstrapThemePreset> = {
  "bootstrap:default": { id: "bootstrap:default", title: "Framework default", description: "No user CSS-variable overrides. Uses Bootstrap and app-provided variables unchanged.", source: "built-in", settings: { colorMode: "system", primaryColor: "#0D6EFD", borderRadius: 6, bodyFontSize: 16, bodyLineHeight: 1.5, borderWidth: 1, focusRingOpacity: 0.25 } },
  "bootstrap:classic": { id: "bootstrap:classic", title: "Bootstrap 5.3 classic", description: "Bootstrap's canonical primary, spacing metrics, borders, and focus ring.", source: "built-in", settings: { colorMode: "system", primaryColor: "#0D6EFD", borderRadius: 6, bodyFontSize: 16, bodyLineHeight: 1.5, borderWidth: 1, focusRingOpacity: 0.25 } },
  "bootstrap:compact": { id: "bootstrap:compact", title: "Compact utilities", description: "Smaller root type metrics, tighter line-height, and restrained radii.", source: "built-in", settings: { colorMode: "system", primaryColor: "#0D6EFD", borderRadius: 3, bodyFontSize: 14, bodyLineHeight: 1.35, borderWidth: 1, focusRingOpacity: 0.2 } },
  "bootstrap:accessible": { id: "bootstrap:accessible", title: "Strong focus", description: "A thicker border and more visible native Bootstrap focus treatment.", source: "built-in", settings: { colorMode: "system", primaryColor: "#0A58CA", borderRadius: 6, bodyFontSize: 16, bodyLineHeight: 1.6, borderWidth: 2, focusRingOpacity: 0.45 } },
};

export function isValidBootstrapHex(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value.trim());
}

function rgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [Number.parseInt(value.slice(0, 2), 16), Number.parseInt(value.slice(2, 4), 16), Number.parseInt(value.slice(4, 6), 16)];
}

function mix(hex: string, target: number, amount: number): string {
  const values = rgb(hex).map((channel) => Math.round(channel + (target - channel) * amount));
  return `#${values.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

export function bootstrapPresetCssVariables(preset: BootstrapThemePreset): BootstrapThemeVariables {
  if (preset.id === "bootstrap:default") return {};
  const primary = preset.settings.primaryColor.toUpperCase();
  const [r, g, b] = rgb(primary);
  const hover = mix(primary, 0, 0.16);
  const active = mix(primary, 0, 0.24);
  const subtle = mix(primary, 255, 0.82);
  const emphasis = mix(primary, 0, 0.38);
  const contrast = (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#000000" : "#FFFFFF";
  return {
    "--bs-primary": primary,
    "--bs-primary-rgb": `${r}, ${g}, ${b}`,
    "--bs-primary-text-emphasis": emphasis,
    "--bs-primary-bg-subtle": subtle,
    "--bs-primary-border-subtle": mix(primary, 255, 0.62),
    "--bs-border-radius": `${preset.settings.borderRadius}px`,
    "--bs-border-radius-sm": `${Math.max(0, preset.settings.borderRadius - 2)}px`,
    "--bs-border-radius-lg": `${preset.settings.borderRadius + 2}px`,
    "--bs-body-font-size": `${preset.settings.bodyFontSize}px`,
    "--bs-body-line-height": preset.settings.bodyLineHeight,
    "--bs-border-width": `${preset.settings.borderWidth}px`,
    "--bs-focus-ring-opacity": preset.settings.focusRingOpacity,
    "--bs-focus-ring-color": `rgb(${r} ${g} ${b} / ${preset.settings.focusRingOpacity})`,
    "--aih-bs-primary-hover": hover,
    "--aih-bs-primary-active": active,
    "--aih-bs-primary-contrast": contrast,
  };
}

