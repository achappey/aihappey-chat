import * as React from "react";
import { JSX } from "react";

type TextAs =
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

export const Text = ({
  as = "span",
  wrap,
  weight,
  truncate,
  font,
  block,
  strikethrough,
  underline,
  size,
  italic,
  children,
}: {
  as?: TextAs;
  wrap?: boolean;
  italic?: boolean;
  weight?: "bold" | "medium" | "regular" | "semibold";
  truncate?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  block?: boolean;
  font?: "base" | "numeric" | "monospace";
  size?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 1000;
  children: React.ReactNode;
}): JSX.Element => {
  const className = [
    truncate ? "text-truncate" : null,
    wrap === false ? "text-nowrap" : null,
    italic ? "fst-italic" : null,
    underline ? "text-decoration-underline" : null,
    strikethrough ? "text-decoration-line-through" : null,

    // weight
    weight === "bold" ? "fw-bold" : null,
    weight === "semibold" ? "fw-semibold" : null,
    weight === "medium" ? "fw-medium" : null,
    weight === "regular" ? "fw-normal" : null,

    // font
    font === "monospace" || font === "numeric"
      ? "font-monospace"
      : null,

    // size → Bootstrap fs-*
    size && size >= 900 ? "fs-1" :
    size && size >= 800 ? "fs-2" :
    size && size >= 700 ? "fs-3" :
    size && size >= 600 ? "fs-4" :
    size && size >= 500 ? "fs-5" :
    size ? "fs-6" : null,
  ]
    .filter(Boolean)
    .join(" ");

  const Component = as;

  return <Component className={className}>{children}</Component>;
};
