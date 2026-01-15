import {
  ProgressBar as FluentProgressBar,
  Field,
  Tooltip,
} from "@fluentui/react-components";
import type { ProgressBarComponent } from "aihappey-types";
import React from "react";

export const ProgressBar2 = ({
  value = 0,
  label,
  tooltipContent,
  className,
}: {
  value?: number;
  label?: string;
  className?: string;
  tooltipContent?: React.ReactElement
}) => (
  <>{tooltipContent ? <Tooltip relationship="label" content={tooltipContent}>
    <Field validationMessage={label} className={className} validationState="none">
      <FluentProgressBar value={value > 1 ? value / 100 : value} />
    </Field>
  </Tooltip>
    : <Field validationMessage={label} className={className} validationState="none">
      <FluentProgressBar value={value > 1 ? value / 100 : value} />
    </Field>}</>
);

export const ProgressBar: ProgressBarComponent = ({
  value = 0,
  label,
  className,
  tooltipContent,
}) => {
  const normalizedValue = value > 1 ? value / 100 : value;

  const content = (
    <Field
      validationMessage={label}
      className={className}
      validationState="none"
    >
      <FluentProgressBar value={normalizedValue} />
    </Field>
  );

  return tooltipContent ? (
    <Tooltip relationship="label" content={tooltipContent}>
      {content}
    </Tooltip>
  ) : (
    content
  );
};