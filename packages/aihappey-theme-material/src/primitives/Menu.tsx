import * as React from "react";
import { Button as MuiButton, Menu as MuiMenu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import type { MenuItemProps, MenuProps, SplitButtonMenuItem } from "aihappey-types";
import { renderIcon } from "./icons";

function renderMenuItems(items: MenuItemProps[] | SplitButtonMenuItem[]): React.ReactNode[] {
  return items.flatMap((item: any) => [
    <MenuItem key={item.key} disabled={item.disabled} onClick={item.onClick} sx={item.danger ? { color: "error.main" } : undefined}>
      {item.icon ? <ListItemIcon>{renderIcon(item.icon)}</ListItemIcon> : null}<ListItemText>{item.label}</ListItemText>
    </MenuItem>,
    ...(item.children?.length ? renderMenuItems(item.children) : []),
  ]);
}

export const Menu = ({ items, trigger, align = "right", className }: MenuProps) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const defaultTrigger = <MuiButton variant="text">More</MuiButton>;
  return <>{React.cloneElement((trigger ?? defaultTrigger) as React.ReactElement<any>, { onClick: (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget) })}<MuiMenu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)} className={className} anchorOrigin={{ horizontal: align === "left" ? "left" : "right", vertical: "bottom" }} transformOrigin={{ horizontal: align === "left" ? "left" : "right", vertical: "top" }}>{renderMenuItems(items)}</MuiMenu></>;
};

