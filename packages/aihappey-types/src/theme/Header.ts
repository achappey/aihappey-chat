import type * as React from "react";
import type { JSX } from "react";

/**
 * Typography heading (h1-h6)
 */
export type HeaderProps = {
  /** 1–6 ⇒ <h1> … <h6>  (default = 1) */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
};

export type HeaderComponent = (props: HeaderProps) => JSX.Element;
