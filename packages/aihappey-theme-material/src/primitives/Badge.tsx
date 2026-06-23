import { Box, Chip } from "@mui/material";
import type { IconToken } from "aihappey-types";
import { renderIcon } from "./icons";
import { mapButtonColor, mapChipVariant, mapSize } from "./utils";

export const Badge = ({ bg, color, appearance, variant, size, icon, text, children, style, ...rest }: any) => (
  <Chip
    color={mapButtonColor(color ?? bg) as any}
    variant={mapChipVariant(appearance, variant)}
    size={mapSize(size) === "large" ? "medium" : "small"}
    icon={icon ? <Box component="span" sx={{ display: "inline-flex", alignItems: "center", justifyContent: "center", ml: 0.25, mr: -0.25 }}>{renderIcon(icon as IconToken, 15)}</Box> : undefined}
    label={children ?? text}
    sx={{ maxWidth: "100%", "& .MuiChip-label": { px: icon ? 0.75 : undefined, overflow: "hidden", textOverflow: "ellipsis" }, "& .MuiChip-icon": { color: "inherit" }, ...style }}
    {...rest}
  />
);

