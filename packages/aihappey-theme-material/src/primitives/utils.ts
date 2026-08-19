import type { AlertColor, ButtonProps, ChipProps } from "@mui/material";

export function mapColor(variant?: string): AlertColor | undefined {
  if (variant === "danger" || variant === "destructive" || variant === "error") return "error";
  if (variant === "success") return "success";
  if (variant === "warning") return "warning";
  if (variant === "secondary") return "info";
  if (variant === "informative" || variant === "info") return "info";
  return undefined;
}

export function mapButtonVariant(variant?: string): ButtonProps["variant"] {
  if (variant === "outline") return "outlined";
  if (variant === "ghost" || variant === "subtle" || variant === "transparent") return "text";
  return "contained";
}

export function mapButtonColor(variant?: string): ButtonProps["color"] {
  if (variant === "danger" || variant === "destructive" || variant === "error") return "error";
  if (variant === "success") return "success";
  if (variant === "warning") return "warning";
  if (variant === "secondary") return "secondary";
  if (variant === "informative" || variant === "info") return "info";
  return "primary";
}

export function mapSize(size?: string): "small" | "medium" | "large" {
  if (size === "large" || size === "lg") return "large";
  if (size === "small" || size === "sm" || size === "extra-small" || size === "xs") return "small";
  return "medium";
}

export function mapChipVariant(appearance?: string, variant?: string, color?: string): ChipProps["variant"] {
  if (variant === "outline" || appearance === "outline") return "outlined";
  if (variant === "filled" || appearance === "filled") return "filled";
  const semantic = color === "danger" || color === "destructive" || color === "error" || color === "severe"
    || color === "success" || color === "warning" || color === "important"
    || color === "informative" || color === "info" || color === "primary" || color === "secondary";
  return semantic ? "filled" : "outlined";
}

export function mapModalSize(size?: string | number) {
  if (typeof size === "number") return size;
  if (size === "small" || size === "sm") return 360;
  if (size === "large" || size === "lg") return 900;
  if (size === "xl") return 1140;
  return 600;
}

