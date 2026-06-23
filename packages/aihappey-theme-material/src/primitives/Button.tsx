import * as React from "react";
import { Button as MuiButton, IconButton } from "@mui/material";
import type { IconToken } from "aihappey-types";
import { renderIcon } from "./icons";
import { mapButtonColor, mapButtonVariant, mapSize } from "./utils";

export const Button = ({ variant = "primary", size, icon, iconPosition = "left", children, style, ...rest }: any) => {
  const hasChildren = React.Children.count(children) > 0;
  const startIcon = icon && iconPosition === "left" ? renderIcon(icon as IconToken) : undefined;
  const endIcon = icon && iconPosition === "right" ? renderIcon(icon as IconToken) : undefined;

  if (icon && !hasChildren) {
    return (
      <IconButton
        color={mapButtonColor(variant)}
        size={mapSize(size)}
        title={rest.title}
        aria-label={rest["aria-label"] ?? rest.title ?? String(icon)}
        sx={{ flex: "0 0 auto", ...style }}
        {...rest}
      >
        {renderIcon(icon as IconToken, size === "large" || size === "lg" ? 22 : 18)}
      </IconButton>
    );
  }

  return (
    <MuiButton
      variant={mapButtonVariant(variant)}
      color={mapButtonColor(variant)}
      size={mapSize(size)}
      startIcon={startIcon}
      endIcon={endIcon}
      sx={style}
      {...rest}
    >
      {children}
    </MuiButton>
  );
};

export const ToggleButton = ({ checked = false, variant, ...props }: any) => (
  <Button variant={checked ? variant ?? "primary" : "outline"} aria-pressed={checked} data-state={checked ? "on" : "off"} {...props} />
);

