import type { JSX } from "react";

export type ProgressBarProps = {
  value?: number; // 0-100
  label?: string;
  variant?: string;
  striped?: boolean;
  animated?: boolean;
  className?: string;
  tooltipContent?: React.ReactElement
};

export type ProgressBarComponent = (props: ProgressBarProps) => JSX.Element;
