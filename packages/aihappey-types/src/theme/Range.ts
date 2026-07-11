import type * as React from "react";
import type { JSX } from "react";

export type RangeValue = [number, number];

/**
 * Range input primitive for selecting a numeric minimum and maximum.
 */
export type RangeProps = {
  id?: string;
  value: RangeValue;
  onChange: (value: RangeValue) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  minLabel?: string;
  maxLabel?: string;
  disabled?: boolean;
  showValue?: boolean;
  valueFormat?: (value: number) => string;
  className?: string;
  style?: React.CSSProperties;
};

export type RangeComponent = (props: RangeProps) => JSX.Element;

