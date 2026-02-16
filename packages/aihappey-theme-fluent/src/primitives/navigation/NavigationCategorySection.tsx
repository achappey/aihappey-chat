
/* ============================================================
   Category
============================================================ */

import { NavCategory, NavCategoryItem, NavSubItemGroup, NavSubItem, Badge, tokens } from "@fluentui/react-components";
import { IconToken } from "aihappey-types";
import React from "react";
import { iconMap } from "../Button";

type CategorySectionProps = {
  item: any;
  onSelect?: (key: string) => void;
  translations?: any
};

export const NavigationCategorySection: React.FC<CategorySectionProps> = ({ item, onSelect, translations }) => {
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
        {item.children.map((b: any) => (
          <NavSubItem
            key={b.key}
            style={{ gap: tokens.spacingVerticalS }}
            value={b.key}
            onClick={() => (b.onClick ? b.onClick() : onSelect?.(b.href))}
          >
            {b.label}
            {b.new && (
              <Badge color="informative" appearance="outline">
                {translations?.new ?? "new"}
              </Badge>
            )}
          </NavSubItem>
        ))}
      </NavSubItemGroup>
    </NavCategory>
  );
};
