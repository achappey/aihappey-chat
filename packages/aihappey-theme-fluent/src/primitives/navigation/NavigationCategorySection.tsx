
/* ============================================================
   Category
============================================================ */

import { NavCategory, NavCategoryItem, NavSubItemGroup, NavSubItem, Badge, tokens, Menu, MenuTrigger, Button, MenuPopover, MenuList, MenuItem } from "@fluentui/react-components";
import { MoreHorizontalRegular, EyeRegular, EyeOffRegular } from "@fluentui/react-icons";
import { IconToken } from "aihappey-types";
import React from "react";
import { iconMap } from "../Button";

type CategorySectionProps = {
  item: any;
  onSelect?: (key: string) => void;
  onToggleNavigationItemHidden?: (key: string) => Promise<void> | void;
  translations?: any
};

const renderBadge = (badge: React.ReactNode) => {
  if (!badge) return null;
  if (React.isValidElement(badge)) {
    return <span style={{ marginLeft: "auto", flex: "0 0 auto" }}>{badge}</span>;
  }

  return <Badge appearance="outline" style={{ marginLeft: "auto", flex: "0 0 auto" }}>{badge}</Badge>;
};

const NavigationCategoryChild = ({ child, onSelect, onToggleNavigationItemHidden, translations }: {
  child: any;
  onSelect?: (key: string) => void;
  onToggleNavigationItemHidden?: (key: string) => Promise<void> | void;
  translations?: any;
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const showNavigationItemActions = !!child.configurableNavigationItem && !!onToggleNavigationItemHidden;

  return (
    <NavSubItem
      key={child.key}
      style={{ gap: tokens.spacingVerticalS }}
      value={child.key}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => (child.onClick ? child.onClick() : onSelect?.(child.key))}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", minWidth: 0 }}>
        <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{child.label}</span>
        {renderBadge(child.badge)}
      </span>
      {child.new && (
        <Badge color="informative" appearance="outline">
          {translations?.new ?? "new"}
        </Badge>
      )}
      {showNavigationItemActions && (
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Button
              size="small"
              appearance="transparent"
              icon={isHovered ? <MoreHorizontalRegular /> : <span style={{ width: 24, height: 24 }} />}
              style={{
                opacity: isHovered ? 1 : 0,
                transition: "opacity 120ms ease",
              }}
              onClick={e => e.stopPropagation()}
            />
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem
                icon={child.hiddenNavigationItem ? <EyeRegular /> : <EyeOffRegular />}
                onClick={async e => {
                  e.stopPropagation();
                  await onToggleNavigationItemHidden?.(child.key);
                  setIsHovered(false);
                }}
              >
                {child.hiddenNavigationItem
                  ? (translations?.show ?? "show")
                  : (translations?.hide ?? "hide")}
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      )}
    </NavSubItem>
  );
};

export const NavigationCategorySection: React.FC<CategorySectionProps> = ({ item, onSelect, onToggleNavigationItemHidden, translations }) => {
  return (
    <NavCategory value={item.label}>
      <NavCategoryItem
        style={{ paddingTop: 4, paddingBottom: 4 }}
        icon={
          item.icon && iconMap[item.icon as IconToken] ? (
            <span style={{ display: "flex", alignItems: "center" }}>
              {React.createElement(iconMap[item.icon as IconToken], {
                style: { fontSize: 24, display: "block" },
              })}
            </span>
          ) : null
        }
      >
        {item.label}
      </NavCategoryItem>

      <NavSubItemGroup>
        {item.children.map((child: any) => (
          <NavigationCategoryChild
            key={child.key}
            child={child}
            translations={translations}
            onSelect={onSelect}
            onToggleNavigationItemHidden={onToggleNavigationItemHidden}
          />
        ))}
      </NavSubItemGroup>
    </NavCategory>
  );
};
