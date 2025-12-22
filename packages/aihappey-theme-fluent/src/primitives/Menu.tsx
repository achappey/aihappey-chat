

// AppMenuFluent.tsx

import {
  Menu as FMenu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Button,
} from "@fluentui/react-components";
import { MoreHorizontalRegular, MoreVerticalRegular } from "@fluentui/react-icons";
import { MenuItemProps } from "aihappey-types";
import React from "react";
import { iconMap } from "./Button";

export type MenuProps = {
  items: MenuItemProps[];
  trigger?: React.ReactElement;
  align?: "left" | "right";
  size?: "small" | "medium";
  className?: string;
};

export const Menu: React.FC<MenuProps> = ({
  items,
  trigger,
  size = "small",
  className,
}) => {

  const renderItems = (menuItems: MenuItemProps[]) =>
    menuItems.map((item) => {
      const IconElem = item.icon ? iconMap[item.icon] : undefined;
      
      return item.children && item.children.length > 0 ? (
        <FMenu key={item.key}>
          <MenuTrigger disableButtonEnhancement>
            <MenuItem>{item.label}</MenuItem>
          </MenuTrigger>
          <MenuPopover>
            <MenuList>{renderItems(item.children)}</MenuList>
          </MenuPopover>
        </FMenu>
      ) : (
        <MenuItem
          key={item.key}
          icon={IconElem && <IconElem />}
          onClick={item.onClick}
          style={item.danger ? { color: "red" } : undefined}
        >
          {item.label}
        </MenuItem>
      )
    }
    );

  return (
    <FMenu>
      <MenuTrigger disableButtonEnhancement>
        {trigger || (
          <Button
            size={size}
            appearance="transparent"
            icon={<MoreVerticalRegular />}
            onClick={(e) => e.stopPropagation()}
            className={className}
          />
        )}
      </MenuTrigger>
      <MenuPopover>
        <MenuList>{renderItems(items)}</MenuList>
      </MenuPopover>
    </FMenu>
  );
};


/*import {
  Menu as FMenu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Button,
} from "@fluentui/react-components";
import { MoreHorizontalRegular } from "@fluentui/react-icons";
import { MenuProps } from "aihappey-types";

export const Menu = ({
  items,
  trigger,
  size = "small",
  className,
}: MenuProps) => (
  <FMenu>
    <MenuTrigger disableButtonEnhancement>
      {trigger || (
        <Button
          size={size}
          appearance="transparent"
          icon={<MoreHorizontalRegular />}
          onClick={(e) => e.stopPropagation()}
          className={className}
        />
      )}
    </MenuTrigger>
    <MenuPopover>
      <MenuList>
        {items.map((item) => (
          <MenuItem
            key={item.key}
            onClick={item.onClick}
            style={item.danger ? { color: "red" } : undefined}
          >
            {item.label}
          </MenuItem>
        ))}
      </MenuList>
    </MenuPopover>
  </FMenu>
);
*/