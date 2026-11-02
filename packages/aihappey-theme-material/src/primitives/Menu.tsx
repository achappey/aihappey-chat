import * as React from "react";
import { Button as MuiButton, Menu as MuiMenu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import type { MenuItemProps, MenuProps, SplitButtonMenuItem } from "aihappey-types";
import { renderIcon } from "./icons";

function renderMenuItems(items: MenuItemProps[] | SplitButtonMenuItem[], close: () => void): React.ReactNode[] {
  return items.map((item: any) => item.children?.length ? <Submenu key={item.key} item={item} close={close} /> : (
    <MenuItem key={item.key} disabled={item.disabled} onClick={() => { close(); void item.onClick?.(); }} sx={item.danger ? { color: "error.main" } : undefined}>
      {item.icon ? <ListItemIcon>{renderIcon(item.icon)}</ListItemIcon> : null}<ListItemText>{item.label}</ListItemText>
    </MenuItem>
  ));
}

function Submenu({ item, close }: { item: MenuItemProps; close: () => void }) {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const trigger = React.useRef<HTMLLIElement>(null);
  const left = !!anchor && anchor.getBoundingClientRect().right + 220 > window.innerWidth;
  const collapse = () => { setAnchor(null); trigger.current?.focus(); };
  return <>
    <MenuItem ref={trigger} disabled={item.disabled} aria-haspopup="menu" aria-expanded={!!anchor}
      onClick={event => setAnchor(event.currentTarget)} onKeyDown={event => {
        if (event.key === "ArrowRight") { event.preventDefault(); event.stopPropagation(); setAnchor(event.currentTarget); }
      }}>
      {item.icon ? <ListItemIcon>{renderIcon(item.icon)}</ListItemIcon> : null}
      <ListItemText>{item.label}</ListItemText>{renderIcon("chevronRight")}
    </MenuItem>
    {anchor && <MuiMenu anchorEl={anchor} open onClose={collapse} disableScrollLock
      anchorOrigin={{ vertical: "top", horizontal: left ? "left" : "right" }}
      transformOrigin={{ vertical: "top", horizontal: left ? "right" : "left" }}
      slotProps={{ list: { onKeyDown: (event: React.KeyboardEvent) => {
        if (event.key === "ArrowLeft" || event.key === "Escape") { event.preventDefault(); event.stopPropagation(); collapse(); }
      } } }}>
      {renderMenuItems(item.children ?? [], close)}
    </MuiMenu>}
  </>;
}

export const Menu = ({ items, trigger, align = "right", direction = "bottom", className }: MenuProps) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const defaultTrigger = <MuiButton variant="text">More</MuiButton>;
  return <>{React.cloneElement((trigger ?? defaultTrigger) as React.ReactElement<any>, { onClick: (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget) })}<MuiMenu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)} className={className} anchorOrigin={{ horizontal: align === "left" ? "left" : "right", vertical: direction === "top" ? "top" : "bottom" }} transformOrigin={{ horizontal: align === "left" ? "left" : "right", vertical: direction === "top" ? "bottom" : "top" }}>{anchorEl ? renderMenuItems(items, () => setAnchorEl(null)) : null}</MuiMenu></>;
};

