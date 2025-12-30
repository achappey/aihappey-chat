import * as React from "react";
import type { ComponentProps, JSX } from "react";
import {
  ToggleButton as FluentToggleButton,
  Tooltip,
} from "@fluentui/react-components";
import type { IconToken } from "aihappey-types";
import { iconMap } from "./Button";

export const ToggleButton = ({
  variant = "primary",
  size = "medium",
  checked,
  icon,
  iconPosition = "left",
  title,
  children,
  ...rest
}: ComponentProps<"button"> & {
  variant?: string;
  size?: string;
  checked?: boolean;
  title?: string;
  icon?: IconToken;
  iconPosition?: "left" | "right";
  children?: React.ReactNode;
}): JSX.Element => {
  const IconElem = icon ? iconMap[icon] : undefined;

  const appearance =
    variant === "primary"
      ? "primary"
      : variant === "secondary"
        ? "secondary"
        : variant === "outline"
          ? "outline"
          : "transparent";

  const sizeValue =
    size === "sm" || size === "small"
      ? "small"
      : size === "lg" || size === "large"
        ? "large"
        : "medium";

  const button = (
    <FluentToggleButton
      checked={checked}
      appearance={appearance}
      size={sizeValue}
      icon={IconElem && iconPosition === "left" ? <IconElem /> : undefined}
      iconAfter={IconElem && iconPosition === "right" ? <IconElem /> : undefined}
      {...(rest as any)}
    >
      {children}
    </FluentToggleButton>
  );

  return title ? (
    <Tooltip relationship="label" content={title}>
      {button}
    </Tooltip>
  ) : (
    button
  );
};
