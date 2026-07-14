import type * as React from "react";
import type { JSX } from "react";

import type { IconToken } from "./IconToken";

export type BadgeProps = {
  bg?: string;
  color?: string;
  variant?: string;
  appearance?: any;
  size?: any;
  icon?: IconToken | undefined;
  text?: string;
  title?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

export type BadgeComponent = (props: BadgeProps) => JSX.Element;
