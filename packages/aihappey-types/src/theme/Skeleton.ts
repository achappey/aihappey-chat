import type * as React from "react";
import type { JSX } from "react";

/**
 * Skeleton placeholder for loading content.
 */
export type SkeletonProps = {
  width?: number | string;
  height?: number | string;
  circle?: boolean;
  animation?: "pulse" | "wave";
  className?: string;
  style?: React.CSSProperties;
};

export type SkeletonComponent = (props: SkeletonProps) => JSX.Element;
