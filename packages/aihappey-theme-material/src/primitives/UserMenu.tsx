import * as React from "react";
import { IconButton, ListSubheader, Menu, MenuItem, Divider } from "@mui/material";
import type { UserMenuProps } from "aihappey-types/src/theme/UserMenu";
import { renderIcon } from "./icons";

export const UserMenu = ({ email, onCustomize, onSettings, onLogout, showApiKeysItem, onApiKeys, providers = [], providersDisabled, className, labels }: UserMenuProps) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  return <><IconButton aria-label="User menu" className={className} onClick={(event) => setAnchorEl(event.currentTarget)}>{renderIcon("customize")}</IconButton><Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>{email ? <ListSubheader>{email}</ListSubheader> : null}{onCustomize ? <MenuItem onClick={onCustomize}>{renderIcon("personalization")} {labels?.customize ?? "Customize"}</MenuItem> : null}<MenuItem onClick={onSettings}>{renderIcon("settings")} {labels?.settings ?? "Settings"}</MenuItem>{showApiKeysItem ? <MenuItem onClick={onApiKeys}>{renderIcon("settings")} {labels?.apiKeys ?? "API keys"}</MenuItem> : null}{providers.length ? <ListSubheader>Providers</ListSubheader> : null}{providers.map((provider) => <MenuItem key={provider} disabled={providersDisabled}>{provider}</MenuItem>)}<Divider /><MenuItem onClick={onLogout} sx={{ color: "error.main" }}>{renderIcon("logout")} {labels?.logout ?? "Logout"}</MenuItem></Menu></>;
};

