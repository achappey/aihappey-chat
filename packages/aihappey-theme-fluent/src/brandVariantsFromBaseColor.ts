import chroma from "chroma-js";
import type { BrandVariants } from "@fluentui/react-components";

const BRAND_STOPS = [
    10, 20, 30, 40, 50, 60, 70, 80,
    90,
    100, 110, 120, 130, 140, 150, 160
] as const;

/**
 * Creates Fluent v9 BrandVariants from one base color.
 * - 10 is darkest
 * - 160 is lightest
 * - 90 is exactly the chosen base
 */
export function brandVariantsFromBaseColor(baseHex: string, mode?: chroma.InterpolationMode): BrandVariants {
    const base = chroma(baseHex).hex().toUpperCase();

    // 8 dark stops (10..80): closer to base near 80, darkest near 10
    const dark = chroma
        .scale([base, "#000"])
        .mode(mode ?? "lch")
        .colors(9)            // includes base and black
        .slice(1)             // drop base
        .reverse()            // black-ish first
        .map((c) => chroma(c).hex().toUpperCase()); // ensure #RRGGBB

    // 7 light stops (100..160): base -> white, excluding base
    const light = chroma
        .scale([base, "#fff"])
        .mode(mode ?? "lch")
        .colors(8)            // includes base and white
        .slice(1)             // drop base
        .map((c) => chroma(c).hex().toUpperCase());

    const colors = [...dark, base, ...light]; // 8 + 1 + 7 = 16

    const variants: any = {};
    for (let i = 0; i < BRAND_STOPS.length; i++) {
        variants[BRAND_STOPS[i]] = colors[i];
    }

    return variants as BrandVariants;
}
