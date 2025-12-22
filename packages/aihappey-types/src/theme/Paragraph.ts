import type * as React from "react";
import type { JSX } from "react";

/**
 * Typography paragraph/body text
 */
export type ParagraphProps = {
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
};

export type ParagraphComponent = (props: ParagraphProps) => JSX.Element;
