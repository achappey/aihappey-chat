import * as React from "react";
import { Text as FluentText } from "@fluentui/react-components";
import { JSX } from "react";

export const Text = ({
  wrap,
  weight,
  truncate,
  font,
  as,
  block,
  strikethrough,
  align,
  style,
  underline,
  size,
  italic,
  children,
}: {
  as?: "b"
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
  | "strong",
  wrap?: boolean;
  italic?: boolean;
  weight?: "bold" | "medium" | "regular" | "semibold"
  align?: "center" | "start" | "end" | "justify";
  truncate?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  style?: React.CSSProperties,
  block?: boolean;
  font?: "base" | "numeric" | "monospace"
  size?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 1000
  children: React.ReactNode;
}): JSX.Element => {

  return <FluentText size={size}
    as={as}
    italic={italic}
    truncate={truncate}
    weight={weight}
    align={align}
    underline={underline}
    strikethrough={strikethrough}
    block={block}
    wrap={wrap}
    style={style}
    font={font}>
    {children}
  </FluentText>;
};
