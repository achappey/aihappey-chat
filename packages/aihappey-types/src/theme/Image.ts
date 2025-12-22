import type * as React from "react";
import type { JSX } from "react";

export type ImageProps = {
  fit?: "none" | "center" | "contain" | "cover" | "default";
  shadow?: boolean;
  block?: boolean;
  src?: string;
  width?: any;
  height?: any;
  bordered?: boolean;
  shape?: "circular" | "rounded" | "square";
};

export type ImageComponent = (props: ImageProps) => JSX.Element;
