import * as React from "react";
import { Field, Switch as FluentSwitch } from "@fluentui/react-components";

export const Switch = ({
  id,
  label,
  checked,
  disabled,
  onChange,
  size,
  required,
  hint,
  className,
}: {
  id: string;
  label?: string;
  hint?: string;
  size?: string;
  checked: boolean;
  disabled?: boolean
  required?: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}): JSX.Element => {
  const switchElement = (
    <FluentSwitch
      id={id}
      required={required}
      disabled={disabled}
      size={size as any}
      checked={checked}
      onChange={(_, data) => onChange(data.checked)}
      className={className}
      label={label}
    />
  );

  return label ? (
    <Field hint={hint} required={required}>
      {switchElement}
    </Field>
  ) : (
    switchElement
  );
};
