import * as React from "react";
import { ButtonGroup, IconButton, Menu as MuiMenu } from "@mui/material";
import { Button } from "./Button";
import { renderIcon } from "./icons";
import { mapButtonColor } from "./utils";

export const SplitButton = ({ label, onClick, menuItems, variant = "primary", size, icon, iconPosition = "left", disabled, align, className, stopPropagation = true }: any) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  return <ButtonGroup className={className} variant="contained"><Button variant={variant} size={size} icon={icon} iconPosition={iconPosition} disabled={disabled} onClick={(event: any) => { if (stopPropagation) event.stopPropagation(); onClick?.(event); }}>{label}</Button><IconButton color={mapButtonColor(variant)} disabled={disabled} onClick={(event) => setAnchorEl(event.currentTarget)}>{renderIcon("chevronDown")}</IconButton><MuiMenu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>{menuItems?.map((item: any) => <Button key={item.key} variant="subtle" icon={item.icon} disabled={item.disabled} onClick={item.onClick}>{item.label}</Button>)}</MuiMenu></ButtonGroup>;
};

