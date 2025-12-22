import type * as React from "react";
import type { JSX } from "react";

/**
 * Slider input primitive for numeric values.
 */
export type SliderProps = {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  disabled?: boolean;
  showValue?: boolean;
  valueFormat?: (value: number) => string;
  className?: string;
  style?: React.CSSProperties;
};

export type SliderComponent = (props: SliderProps) => JSX.Element;
