import { Box, Drawer as MuiDrawer, Typography } from "@mui/material";

export const Drawer = ({ open, onClose, title, children, headerNavigation, position = "end", size = "small" }: any) => {
  const width = size === "small" ? 360 : size === "medium" ? 520 : size === "large" ? 760 : "100vw";
  return (
    <MuiDrawer open={open} onClose={onClose} anchor={position === "start" ? "left" : position === "end" ? "right" : position}>
      <Box sx={{ width, maxWidth: "100vw", p: 2 }}>
        {title ? <Typography variant="h6" sx={{ mb: 1 }}>{title}</Typography> : null}
        {headerNavigation}
        {children}
      </Box>
    </MuiDrawer>
  );
};

