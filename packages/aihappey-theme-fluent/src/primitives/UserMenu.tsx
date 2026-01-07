import * as React from "react";
import {
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  MenuItemCheckbox,
  MenuDivider,
  MenuGroup,
  MenuGroupHeader,
  Avatar,
} from "@fluentui/react-components";
import {
  SettingsRegular,
  SignOutRegular,
  PanelLeftRegular,
  PersonSettingsRegular,
  KeyRegular,
  PlugConnectedRegular,
} from "@fluentui/react-icons";

import { UserMenuLabels } from "aihappey-types/src/i18n";

export interface UserMenuProps {
  email?: string;
  onCustomize?: () => void;
  onSettings: () => void;
  onLogout: () => void;

  showApiKeysItem?: boolean;
  onApiKeys?: () => void;

  providers?: string[];
  enabledProviders?: string[];
  onToggleProvider?: (provider: string) => void;

  className?: string;
  style?: React.CSSProperties;
  labels?: UserMenuLabels;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  email,
  onCustomize,
  onSettings,
  onLogout,
  showApiKeysItem,
  onApiKeys,
  providers,
  enabledProviders,
  onToggleProvider,
  className,
  style,
  labels = {},
}) => {
  const handleProvidersCheckedChange = React.useCallback(
    (_e: any, data: any) => {
      // Fluent Menu selection is managed via Menu.checkedValues.
      // We keep app state in sync using a toggle API.
      const nextChecked: string[] = data?.checkedItems ?? [];
      const prevChecked: string[] = enabledProviders ?? [];

      const changed = new Set<string>([...prevChecked, ...nextChecked]);
      for (const p of changed) {
        const wasOn = prevChecked.includes(p);
        const isOn = nextChecked.includes(p);
        if (wasOn !== isOn) onToggleProvider?.(p);
      }
    },
    [enabledProviders, onToggleProvider]
  );

  const trigger = (
    <Avatar
      name={email || "User"}
      color="colorful"
      size={32}
      style={{ fontWeight: 600, fontSize: 18 }}
    />
  );

  return (
    <Menu>
      <MenuTrigger disableButtonEnhancement>
        <span style={{ cursor: "pointer" }} className={className} tabIndex={0}>
          {trigger}
        </span>
      </MenuTrigger>
      <MenuPopover style={style}>
        <MenuList hasCheckmarks>
          {email && (
            <>
              <MenuGroup>
                <MenuGroupHeader>{email}</MenuGroupHeader>
              </MenuGroup>
            </>
          )}



          {onCustomize && <MenuItem icon={<PersonSettingsRegular />} onClick={onCustomize}>
            {labels.customize ?? "Customize"}
          </MenuItem>}


          <MenuItem icon={<SettingsRegular />} onClick={onSettings}>
            {labels.settings ?? "Settings"}
          </MenuItem>

          {!!providers?.length && !!onToggleProvider && (
            <Menu
              persistOnItemClick
              checkedValues={{ providers: enabledProviders ?? [] }}
              onCheckedValueChange={handleProvidersCheckedChange}
            >
              <MenuTrigger disableButtonEnhancement>
                <MenuItem icon={<PlugConnectedRegular />}>{labels.providers ?? "Providers"}</MenuItem>
              </MenuTrigger>
              <MenuPopover>
                <MenuList hasCheckmarks>
                  {!!showApiKeysItem && !!onApiKeys && (
                    <>
                      <MenuItem icon={<KeyRegular />}
                        onClick={onApiKeys}>
                        {labels.apiKeys ?? "API keys"}
                      </MenuItem>
                      <MenuDivider />
                    </>
                  )}

                  {providers.map((p) => (
                    <MenuItemCheckbox
                      key={p}
                      name="providers"
                      value={p}
                    >
                      {p}
                    </MenuItemCheckbox>
                  ))}
                </MenuList>
              </MenuPopover>
            </Menu>
          )}

          <MenuDivider />
          <MenuItem icon={<SignOutRegular />} onClick={onLogout}>
            {labels.logout ?? "Log out"}
          </MenuItem>
        </MenuList>
      </MenuPopover>
    </Menu>
  );
};
