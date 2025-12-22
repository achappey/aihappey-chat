import type * as React from "react";
import type { JSX } from "react";

export type CardProps = {
  title: any;
  size?: "small" | "medium" | "large" | undefined;
  text?: string;
  className?: string;
  description?: any;
  actions?: JSX.Element;
  image?: React.ReactElement;
  headerActions?: JSX.Element;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

export type CardComponent = (props: CardProps) => JSX.Element;
