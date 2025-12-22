import type { ComponentProps, JSX } from "react";

import type { IconToken } from "./IconToken";

export type ButtonProps = ComponentProps<"button"> & {
  variant?: string;
  size?: string;
  icon?: IconToken;
  iconPosition?: "left" | "right";
};

export type ButtonComponent = (props: ButtonProps) => JSX.Element;
