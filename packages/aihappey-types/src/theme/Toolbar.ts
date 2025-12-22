import type * as React from "react";
import type { JSX } from "react";

export type ToolbarProps = {
  ariaLabel?: string;
  size?: "small" | "medium" | "large";
  className?: string;
  children: React.ReactNode;
};

export type ToolbarComponent = (props: ToolbarProps) => JSX.Element;
