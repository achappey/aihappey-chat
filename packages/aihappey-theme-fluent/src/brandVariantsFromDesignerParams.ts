import chroma from "chroma-js";
import type { BrandVariants } from "@fluentui/react-components";

const BRAND_STOPS = [
  10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160,
] as const;

export type BrandDesignerParams = {
  baseHex: string; // "#RRGGBB"
  /**
   * Approximate Fluent Theme Designer hue torsion.
   * Range is intentionally wide; UI will clamp.
   */
  hueTorsion: number; // typically 0..12
  /**
   * Approximate Fluent Theme Designer vibrancy.
   * Negative reduces saturation, positive increases.
   */
  vibrancy: number; // typically -100..100
  /**
   * Interpolation mode for ramp generation.
   * Defaults to lch for perceptual ramp.
   */
  mode?: chroma.InterpolationMode;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function normalizeHex(hex: string) {
  const clean = chroma(hex).hex().toUpperCase();
  return clean;
}

/**
 * Builds Fluent v9 `BrandVariants` from a base color + 2 designer-like parameters.
 *
 * This is an approximation (not the official Fluent Theme Designer algorithm) with these goals:
 * - stop 90 is exactly the base color
 * - Hue torsion introduces a gradual hue rotation through the ramp
 * - Vibrancy pushes/pulls saturation through the ramp
 */
export function brandVariantsFromDesignerParams(
  params: BrandDesignerParams
): BrandVariants {
  const baseHex = normalizeHex(params.baseHex);

  const hueTorsion = clamp(params.hueTorsion ?? 0, -24, 24);
  const vibrancy = clamp(params.vibrancy ?? 0, -100, 100);
  const mode = params.mode ?? "lch";

  // Create a neutral ramp like `brandVariantsFromBaseColor()` (base<->black and base<->white)
  const darkRamp = chroma
    .scale([baseHex, "#000"])
    .mode(mode)
    .colors(9)
    .slice(1)
    .reverse();

  const lightRamp = chroma
    .scale([baseHex, "#fff"])
    .mode(mode)
    .colors(8)
    .slice(1);

  const ramp = [...darkRamp, baseHex, ...lightRamp].map((c) =>
    chroma(c).hex().toUpperCase()
  );

  // Apply hue torsion + vibrancy around base through the ramp.
  // Index 8 corresponds to stop 90.
  const baseIndex = 8;
  const vibFactor = vibrancy / 100; // -1..1

  const adjusted = ramp.map((hex, i) => {
    if (i === baseIndex) return baseHex;

    const dist = i - baseIndex; // negative = dark, positive = light
    const t = dist / baseIndex; // roughly -1..1

    // Hue torsion: rotate away from base more as we move away from the base.
    const hueDelta = hueTorsion * 6 * t; // 6deg per unit is a small-but-visible effect

    // Vibrancy: push saturation away from neutral near the extremes; keep near base stable.
    // Darker side gets slightly more saturation than lighter side.
    const satDelta = vibFactor * (Math.abs(t) ** 0.7) * (dist < 0 ? 0.22 : 0.16);

    // Convert to LCH-ish adjustments (via HSL approximation to keep it simple).
    const hsl = chroma(hex).hsl();
    const h = (isNaN(hsl[0]) ? chroma(baseHex).hsl()[0] : hsl[0]) + hueDelta;
    const s = clamp((hsl[1] ?? 0) + satDelta, 0, 1);
    const l = clamp(hsl[2] ?? 0, 0, 1);

    return chroma.hsl(h, s, l).hex().toUpperCase();
  });

  const variants: any = {};
  for (let i = 0; i < BRAND_STOPS.length; i++) {
    variants[BRAND_STOPS[i]] = adjusted[i];
  }

  return variants as BrandVariants;
}

