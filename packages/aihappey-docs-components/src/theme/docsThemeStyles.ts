import type { CSSProperties } from "react";

export const docsSurfaceStyle: CSSProperties = {
  minHeight: "100dvh",
  background: "inherit",
  color: "inherit",
};

export const docsArticleStyle: CSSProperties = {
  maxWidth: 980,
  padding: "clamp(2rem, 5vw, 5rem)",
  display: "grid",
  gap: 42,
};

export const docsHeroTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(2.6rem, 6vw, 5rem)",
  letterSpacing: "-0.06em",
};

export const docsHeroTextStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(1.1rem, 2vw, 1.35rem)",
  lineHeight: 1.7,
  opacity: 0.76,
};

export const docsMutedTextStyle: CSSProperties = {
  opacity: 0.76,
};

export const docsSubtleSurfaceStyle: CSSProperties = {
  background: "color-mix(in srgb, currentColor 8%, transparent)",
};

export const docsActiveSurfaceStyle: CSSProperties = {
  background: "color-mix(in srgb, currentColor 14%, transparent)",
};

export const docsBorderStyle = "1px solid color-mix(in srgb, currentColor 14%, transparent)";

export const docsCodeStyle: CSSProperties = {
  ...docsSubtleSurfaceStyle,
  border: docsBorderStyle,
  color: "inherit",
};

