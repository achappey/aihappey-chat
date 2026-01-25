import { Spinner as FluentSpinner } from "@fluentui/react-components";
import { JSX } from "react";

export const Spinner = ({
  size = "tiny",
  className,
  label,
}: {
  size?: string;
  label?: string;
  className?: string;
}): JSX.Element => (
  <FluentSpinner
    label={label}
    size={
      size === "sm" || size === "tiny"
        ? "tiny"
        : size === "xs" || size === "extra-small"
        ? "extra-small"
        : size === "md" || size === "medium"
        ? "medium"
        : size === "lg" || size === "large"
        ? "large"
        : "tiny"
    }
    className={className}
  />
);
