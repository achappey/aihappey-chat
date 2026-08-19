import * as React from "react";
import { Button as MuiButton, IconButton, ToggleButton as MuiToggleButton, Tooltip } from "@mui/material";
import type { IconToken } from "aihappey-types";
import { renderIcon } from "./icons";
import { mapButtonColor, mapButtonVariant, mapSize } from "./utils";

const withTooltip = (button: React.ReactElement, title?: React.ReactNode, disabled?: boolean) => {
  if (!title) return button;

  const trigger = disabled
    ? <span style={{ display: "inline-flex" }}>{button}</span>
    : button;
  return <Tooltip title={title} describeChild arrow>{trigger}</Tooltip>;
};

export const Button = ({ variant = "primary", size, icon, iconPosition = "left", children, style, ...rest }: any) => {
  const hasChildren = React.Children.toArray(children).length > 0;
  const mappedSize = mapSize(size);
  const iconButtonSize = mappedSize === "small" ? 32 : mappedSize === "large" ? 48 : 40;
  const startIcon = icon && iconPosition === "left" ? renderIcon(icon as IconToken) : undefined;
  const endIcon = icon && iconPosition === "right" ? renderIcon(icon as IconToken) : undefined;
  const { title, disabled, ...buttonProps } = rest;

  if (icon && !hasChildren) {
    const button = (
      <IconButton
        color={mapButtonColor(variant)}
        size={mappedSize}
        disabled={disabled}
        aria-label={buttonProps["aria-label"] ?? title ?? String(icon)}
        sx={{
          flex: `0 0 ${iconButtonSize}px`,
          width: iconButtonSize,
          minWidth: iconButtonSize,
          maxWidth: iconButtonSize,
          height: iconButtonSize,
          boxSizing: "border-box",
          ...style,
        }}
        {...buttonProps}
      >
        {renderIcon(icon as IconToken, size === "large" || size === "lg" ? 22 : 18)}
      </IconButton>
    );
    return withTooltip(button, title, disabled);
  }

  const button = (
    <MuiButton
      variant={mapButtonVariant(variant)}
      color={mapButtonColor(variant)}
      size={mapSize(size)}
      disabled={disabled}
      startIcon={startIcon}
      endIcon={endIcon}
      sx={style}
      {...buttonProps}
    >
      {children}
    </MuiButton>
  );
  return withTooltip(button, title, disabled);
};

export const ToggleButton = ({ checked = false, variant = "primary", size, icon, iconPosition = "left", children, style, title, disabled, ...rest }: any) => {
  const hasChildren = React.Children.toArray(children).length > 0;
  const color = mapButtonColor(variant);
  const button = (
    <MuiToggleButton
      value={rest.value ?? String(icon ?? "toggle")}
      selected={checked}
      color={color as any}
      size={mapSize(size)}
      disabled={disabled}
      aria-label={rest["aria-label"] ?? title ?? (icon ? String(icon) : undefined)}
      data-state={checked ? "on" : "off"}
      sx={{
        flex: "0 0 auto",
        gap: hasChildren ? 0.75 : 0,
        minWidth: hasChildren ? undefined : 36,
        px: hasChildren ? undefined : 1,
        "&.Mui-selected": {
          color: `${color}.contrastText`,
          bgcolor: `${color}.main`,
          "&:hover": { bgcolor: `${color}.dark` },
        },
        ...style,
      }}
      {...rest}
    >
      {icon && iconPosition === "left" ? renderIcon(icon as IconToken, 18) : null}
      {children}
      {icon && iconPosition === "right" ? renderIcon(icon as IconToken, 18) : null}
    </MuiToggleButton>
  );
  return withTooltip(button, title, disabled);
};

