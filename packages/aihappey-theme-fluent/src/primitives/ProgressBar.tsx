import {
  ProgressBar as FluentProgressBar,
  Field,
} from "@fluentui/react-components";

export const ProgressBar = ({
  value = 0,
  label,
  className,
}: {
  value?: number;
  label?: string;
  className?: string;
}) => (
  <Field validationMessage={label} className={className} validationState="none">
    <FluentProgressBar value={value > 1 ? value / 100 : value} />
  </Field>
);
