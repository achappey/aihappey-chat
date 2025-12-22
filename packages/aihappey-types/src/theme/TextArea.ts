import type * as React from "react";

export type TextAreaProps = {
  ref?: any;
  onKeyDown?: any;
  rows?: number;
  hint?: string;
  onPaste?: any;
  placeholder?: string;
  label?: string;
  value: string;
  readOnly?: boolean;
  autoFocus?: boolean;
  required?: boolean;
  onChange?: (value: string) => void;
  style?: React.CSSProperties;
  className?: string;
};

export type TextAreaComponent = (props: TextAreaProps) => React.ReactNode;
