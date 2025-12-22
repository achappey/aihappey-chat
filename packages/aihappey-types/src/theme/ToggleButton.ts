import type { ComponentProps, JSX } from "react";

import type { IconToken } from "./IconToken";

export type ToggleButtonProps = ComponentProps<"button"> & {
  variant?: string;
  size?: string;
  checked?: boolean;
  icon?: IconToken;
  iconPosition?: "left" | "right";
};

export type ToggleButtonComponent = (props: ToggleButtonProps) => JSX.Element;
