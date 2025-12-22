import type * as React from "react";
import type { JSX } from "react";

import type { IconToken } from "./IconToken";

export type MenuItemProps = {
  key: string;
  label: string;
  icon?: IconToken;
  onClick?: () => void | Promise<void>;
  danger?: boolean; // Optional for "delete" style
  children?: MenuItemProps[]; // for submenus
};

export type MenuProps = {
  items: MenuItemProps[];
  trigger?: React.ReactElement; // Optional, defaults to "More"
  align?: "left" | "right"; // Optional
  size?: "small" | "medium"; // Optional
  className?: string;
};

export type MenuComponent = (props: MenuProps) => JSX.Element;
