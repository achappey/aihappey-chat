import * as React from "react";
import type { ComponentProps, JSX } from "react";
import { ToggleButton as FluentButton } from "@fluentui/react-components";
import type { IconToken } from "aihappey-types";
import { iconMap } from "./Button";

export const ToggleButton = ({
  variant = "primary",
  size = "medium",
  checked,
  icon,
  iconPosition = "left",
  children,
  ...rest
}: ComponentProps<"button"> & {
  variant?: string;
  size?: string;
  checked?: boolean | undefined
  icon?: IconToken;
  iconPosition?: "left" | "right";
  children?: React.ReactNode;
}): JSX.Element => {
  const IconElem = icon ? iconMap[icon] : undefined;
  return (
    <FluentButton
      checked={checked}
      appearance={
        variant === "primary"
          ? "primary"
          : variant === "secondary"
            ? "secondary"
            : variant === "outline"
              ? "outline"
              : "transparent"
      }
      size={
        size === "sm" || size === "small"
          ? "small"
          : size === "lg" || size === "large"
            ? "large"
            : "medium"
      }
      icon={IconElem && iconPosition === "left" ? <IconElem /> : undefined}
      iconAfter={
        IconElem && iconPosition === "right" ? <IconElem /> : undefined
      }
      {...(rest as any)}
    >
      {children}
    </FluentButton>
  );
};
