import { Box, Chip } from "@mui/material";
import { renderIcon } from "./icons";

export const Tags = ({ items = [], size = "small", onRemove }: any) => (
  <Box sx={{ display: "flex", flexDirection: "row", gap: 1, flexWrap: "wrap" }}>
    {items.map((item: any) => <Chip key={item.key} size={size === "medium" ? "medium" : "small"} icon={item.icon ? renderIcon(item.icon, 14) : undefined} label={item.label} onDelete={onRemove ? () => onRemove(item.key) : undefined} />)}
  </Box>
);

