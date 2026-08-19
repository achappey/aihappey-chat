import type * as React from "react";
import type { JSX } from "react";

export type ImageProps = {
  fit?: "none" | "center" | "contain" | "cover" | "default";
  alt?: string;
  shadow?: boolean;
  block?: boolean;
  src?: string;
  title?: string;
  width?: any;
  height?: any;
  bordered?: boolean;
  onClick?: React.MouseEventHandler<HTMLImageElement>;
  style?: React.CSSProperties
  shape?: "circular" | "rounded" | "square";
};

export type ImageComponent = (props: ImageProps) => JSX.Element;
