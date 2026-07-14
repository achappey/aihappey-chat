import type { CSSProperties } from "react";
import type { DocsHttpMethod, DocsNavBadge } from "../navigation/types";

export type DocsBadgeTone = "primary" | "informative" | "success" | "danger" | "secondary";

export type DocsBadgeStyleProps = {
  bg?: DocsBadgeTone;
  color?: DocsBadgeTone;
  appearance?: string;
};

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

export const docsInlineCodeStyle: CSSProperties = {
  background: "color-mix(in srgb, currentColor 10%, transparent)",
  border: "1px solid color-mix(in srgb, currentColor 16%, transparent)",
  borderRadius: "0.35em",
  color: "inherit",
  fontSize: "0.9em",
  fontWeight: 650,
  padding: "0.08em 0.32em",
};

export const docsMethodBadgePropsByMethod: Partial<Record<DocsHttpMethod, DocsBadgeStyleProps>> = {
  POST: { bg: "informative", color: "informative", appearance: "tint" },
  GET: { bg: "success", color: "success", appearance: "tint" },
  DELETE: { bg: "danger", color: "danger", appearance: "tint" },
};

export const getDocsMethodBadgeProps = (method?: string): DocsBadgeStyleProps => {
  const normalizedMethod = method?.trim().toUpperCase() as DocsHttpMethod | undefined;
  return normalizedMethod ? docsMethodBadgePropsByMethod[normalizedMethod] ?? { appearance: "secondary" } : { appearance: "secondary" };
};

export const getDocsNavBadgeLabel = (badge?: DocsNavBadge) => typeof badge === "string" ? badge : badge?.label;

export const getDocsNavBadgeProps = (badge?: DocsNavBadge): DocsBadgeStyleProps => {
  if (!badge) return { appearance: "secondary" };
  if (typeof badge === "string") return getDocsMethodBadgeProps(badge);
  return getDocsMethodBadgeProps(badge.method ?? badge.label);
};

