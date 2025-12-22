import type * as React from "react";
import type { JSX } from "react";

export type SearchBoxProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
  autoFocus?: boolean;
};

export type SearchBoxComponent = (props: SearchBoxProps) => JSX.Element;
