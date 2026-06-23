import * as React from "react";
import { Typography } from "@mui/material";
import type { TextProps } from "aihappey-types/src/theme/Text";

export const Header = ({ level = 1, className, children }: any) => {
  const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
  return <Tag className={className}>{children}</Tag>;
};

export const Text = ({ as = "span", wrap = true, italic, weight, align, truncate, underline, strikethrough, block, font, size, children, style }: TextProps) => (
  <Typography
    component={as as any}
    fontStyle={italic ? "italic" : undefined}
    fontWeight={weight === "bold" ? 700 : weight === "semibold" ? 600 : weight === "medium" ? 500 : undefined}
    textAlign={align}
    noWrap={truncate || !wrap}
    fontFamily={font === "monospace" ? "monospace" : undefined}
    fontSize={size}
    sx={{ display: block ? "block" : undefined, textDecoration: underline ? "underline" : strikethrough ? "line-through" : undefined, ...style }}
  >
    {children}
  </Typography>
);

