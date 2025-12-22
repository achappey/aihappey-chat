import type * as React from "react";
import type { JSX } from "react";

export type CloseButtonProps = {
  onClick: (e: any) => void;
  className?: string;
  style?: React.CSSProperties;
  "aria-label"?: string;
};

export type CloseButtonComponent = (props: CloseButtonProps) => JSX.Element;
