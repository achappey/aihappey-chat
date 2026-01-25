// aihappey-types/src/theme/splitButton.ts
import type * as React from "react";
import { IconToken } from "./IconToken";
import { JSX } from "react";

export type SplitButtonShape = "rounded" | "circular" | "square";

export type SplitButtonMenuItem = {
  key: string;
  label: string;
  icon?: IconToken;
  danger?: boolean;
  disabled?: boolean;

  // supports mouse + keyboard activation from Fluent MenuItem
  onClick?: (e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => void;

  // optional nested submenus
  children?: SplitButtonMenuItem[];
};

export type SplitButtonVariant = "primary" | "secondary" | "outline" | "transparent";
export type SplitButtonSize = "sm" | "small" | "medium" | "lg" | "large";

export type SplitButtonProps = {
  label: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  menuItems: SplitButtonMenuItem[];

  variant?: SplitButtonVariant;
  size?: SplitButtonSize;
  shape?: SplitButtonShape;
  align?: "left" | "right";

  icon?: IconToken;
  iconPosition?: "left" | "right";

  disabled?: boolean;
  className?: string;

  // defaults to true in the component
  stopPropagation?: boolean;
};


export type SplitButtonComponent = (props: SplitButtonProps) => JSX.Element;