// SplitButtonFluent.tsx
import * as React from "react";
import {
  Menu as FMenu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  SplitButton as FluentSplitButton,
} from "@fluentui/react-components";
import type { MenuButtonProps } from "@fluentui/react-components";

import type { SplitButtonProps, SplitButtonMenuItem } from "aihappey-types";
import { iconMap } from "./Button";

function toAppearance(variant?: SplitButtonProps["variant"]) {
  return variant === "primary"
    ? "primary"
    : variant === "secondary"
      ? "secondary"
      : variant === "outline"
        ? "outline"
        : "transparent";
}

function toSize(size?: SplitButtonProps["size"]) {
  return size === "sm" || size === "small"
    ? "small"
    : size === "lg" || size === "large"
      ? "large"
      : "medium";
}


// replace: export const SplitButton: React.FC<SplitButtonProps> = (...) => {
export function SplitButton(props: SplitButtonProps): JSX.Element {
  const {
    label,
    onClick,
    menuItems,
    variant = "primary",
    size = "small",
    shape = "rounded",
    align = "right",
    disabled,
    className,
    icon,
    iconPosition = "left",
    stopPropagation = true,
  } = props;

  const positioning = align === "right" ? "below-end" : "below-start";
  const IconElem = icon ? iconMap[icon] : undefined;
  const handlePrimaryClick = (e: any) => {
    if (stopPropagation) e.stopPropagation();
    //onClick?.(e as any);
  };


  const renderMenuItems = (items: SplitButtonMenuItem[]): JSX.Element[] =>
    items.map((item) => {
      const ItemIcon = item.icon ? iconMap[item.icon] : undefined;

      const handleItemClick: React.MouseEventHandler<HTMLElement> = (e) => {
        if (stopPropagation) e.stopPropagation();
        item.onClick?.(e);
      };

      return item.children && item.children.length > 0 ? (
        <FMenu key={item.key} positioning={positioning}>
          <MenuTrigger disableButtonEnhancement>
            <MenuItem
              icon={ItemIcon && <ItemIcon />}
              disabled={item.disabled}
            >
              {item.label}
            </MenuItem>
          </MenuTrigger>
          <MenuPopover>
            <MenuList>{renderMenuItems(item.children)}</MenuList>
          </MenuPopover>
        </FMenu>
      ) : (
        <MenuItem
          key={item.key}
          icon={ItemIcon && <ItemIcon />}
          disabled={item.disabled}
          onClick={handleItemClick}
        >
          {item.label}
        </MenuItem>
      );
    });

  return (
    <FMenu positioning={positioning}>
      <MenuTrigger disableButtonEnhancement>
        {(triggerProps: MenuButtonProps) => (
          <FluentSplitButton
            menuButton={triggerProps}
            className={className}
            appearance={toAppearance(variant)}
            size={toSize(size)}
            shape={shape}
            disabled={disabled}
            onClick={handlePrimaryClick as any}
            icon={IconElem && iconPosition === "left" ? <IconElem /> : undefined}
          >
            {label}
          </FluentSplitButton>
        )}
      </MenuTrigger>


      <MenuPopover>
        <MenuList>{renderMenuItems(menuItems)}</MenuList>
      </MenuPopover>
    </FMenu>
  );
}
