import type { ComponentProps, JSX } from "react";

import type { IconToken } from "./IconToken";

export type ToolbarButtonProps = ComponentProps<"button"> & {
  icon?: IconToken;
  variant?: string;
  //  ariaLabel?: string;
  //  size?: "small" | "medium" | "large";
  //  className?: string;
  //  children: React.ReactNode;
};

export type ToolbarButtonComponent = (props: ToolbarButtonProps) => JSX.Element;
