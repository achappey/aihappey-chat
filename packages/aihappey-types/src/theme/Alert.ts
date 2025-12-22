import type * as React from "react";
import type { JSX } from "react";

export type AlertProps = {
  variant: string;
  onDismiss?: () => void;
  title?: string;
  className?: string;
  children: React.ReactNode;
};

export type AlertComponent = (props: AlertProps) => JSX.Element;
