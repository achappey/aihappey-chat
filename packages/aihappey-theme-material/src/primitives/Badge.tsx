import { Box, Chip, Tooltip, type ChipProps } from "@mui/material";
import type { IconToken } from "aihappey-types";
import { renderIcon } from "./icons";
import { mapChipVariant, mapSize } from "./utils";

const mapChipColor = (value?: string): ChipProps["color"] => {
  if (value === "danger" || value === "destructive" || value === "error" || value === "severe") return "error";
  if (value === "success") return "success";
  if (value === "warning" || value === "important") return "warning";
  if (value === "informative" || value === "info") return "info";
  if (value === "primary") return "primary";
  if (value === "secondary") return "secondary";
  return "default";
};

export const Badge = ({ bg, color, appearance, variant, size, icon, text, children, style, title, disabled, ...rest }: any) => {
  const chip = (
    <Chip
      color={mapChipColor(color ?? bg ?? appearance)}
      variant={mapChipVariant(appearance, variant, color ?? bg)}
      size={mapSize(size) === "large" ? "medium" : "small"}
      disabled={disabled}
      icon={icon ? <Box component="span" sx={{ display: "inline-flex", alignItems: "center", justifyContent: "center", ml: 0.25, mr: -0.25 }}>{renderIcon(icon as IconToken, 15)}</Box> : undefined}
      label={children ?? text}
      sx={{ maxWidth: "100%", "& .MuiChip-label": { px: icon ? 0.75 : undefined, overflow: "hidden", textOverflow: "ellipsis" }, "& .MuiChip-icon": { color: "inherit" }, ...style }}
      {...rest}
    />
  );

  if (!title) return chip;
  return (
    <Tooltip title={title} describeChild arrow>
      {disabled ? <span style={{ display: "inline-flex" }}>{chip}</span> : chip}
    </Tooltip>
  );
};

