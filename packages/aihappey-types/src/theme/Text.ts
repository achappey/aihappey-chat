import type * as React from "react";
import type { JSX } from "react";

export type TextAs =
  | "b"
  | "em"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "i"
  | "p"
  | "pre"
  | "span"
  | "strong";

export type TextProps = {
  as?: TextAs;
  wrap?: boolean;
  italic?: boolean;
  weight?: "bold" | "medium" | "regular" | "semibold";
  align?: "center" | "start" | "end" | "justify";
  truncate?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  block?: boolean;
  font?: "base" | "numeric" | "monospace";
  size?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 1000;
  children: React.ReactNode;
};

export type TextComponent = (props: TextProps) => JSX.Element;
