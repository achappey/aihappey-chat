import * as React from "react";
import { Box, Divider, List, ListItemButton, ListItemIcon, ListItemText, Collapse, Typography } from "@mui/material";
import type { NavigationItem } from "aihappey-types";
import { renderIcon } from "./icons";

const navItemMatchesActive = (item: NavigationItem, activeKey?: string): boolean => {
  if (!activeKey) return false;
  const itemValue = item.eventKey ?? item.key;
  if (itemValue === activeKey || item.key === activeKey || item.eventKey === activeKey) return true;
  return Array.isArray(item.children) && item.children.some((child: NavigationItem) => navItemMatchesActive(child, activeKey));
};

const NavRow = ({ item, activeKey, onSelect, depth = 0 }: { item: NavigationItem; activeKey?: string; onSelect?: (key: string) => void; depth?: number }) => {
  const [open, setOpen] = React.useState(() => item.children?.some((child: NavigationItem) => navItemMatchesActive(child, activeKey)) ?? false);
  if (item.key === "divider") return <Divider sx={{ my: 0.5 }} />;
  if (item.key?.startsWith?.("section:")) return <Typography variant="caption" color="text.secondary" sx={{ display: "block", px: 2, py: 1 }}>{item.label}</Typography>;

  const itemValue = item.eventKey ?? item.key;
  const selected = !!activeKey && (itemValue === activeKey || item.key === activeKey || item.eventKey === activeKey);
  const hasChildren = !!item.children?.length;
  return <><ListItemButton selected={selected} disabled={item.disabled} sx={{ pl: 2 + depth * 2, gap: 1 }} onClick={(event) => { item.onClick?.(event as any); if (hasChildren) setOpen((value: boolean) => !value); else onSelect?.(itemValue); }}><ListItemIcon sx={{ minWidth: 32 }}>{renderIcon(item.icon)}</ListItemIcon><ListItemText primary={item.label} sx={{ minWidth: 0 }} />{item.badge ? <Typography variant="caption" color="text.secondary" sx={{ ml: "auto", flex: "0 0 auto" }}>{item.badge}</Typography> : null}{hasChildren ? renderIcon(open ? "chevronUp" : "chevronDown") : null}</ListItemButton>{hasChildren ? <Collapse in={open} timeout="auto" unmountOnExit><List disablePadding>{item.children?.map((child: NavigationItem, index: number) => <NavRow key={`${child.key ?? child.eventKey ?? index}:${index}`} item={child} activeKey={activeKey} onSelect={onSelect} depth={depth + 1} />)}</List></Collapse> : null}</>;
};

export const Navigation = ({ items = [], activeKey, onSelect, appTitle, className, style }: any) => (
  <Box className={className} sx={{ overflow: "auto", ...style }}>
    {appTitle ? <Typography variant="h6" sx={{ p: 2 }}>{appTitle}</Typography> : null}
    <List dense>{items.map((item: NavigationItem, index: number) => <NavRow key={`${item.key ?? item.eventKey ?? index}:${index}`} item={item} activeKey={activeKey} onSelect={onSelect} />)}</List>
  </Box>
);

