import type * as React from "react";
import type { JSX } from "react";

import type { IconToken } from "./IconToken";

export type BadgeProps = {
  bg?: string;
  appearance?: any;
  size?: any;
  icon?: IconToken | undefined;
  text?: string;
  children: React.ReactNode;
};

export type BadgeComponent = (props: BadgeProps) => JSX.Element;
