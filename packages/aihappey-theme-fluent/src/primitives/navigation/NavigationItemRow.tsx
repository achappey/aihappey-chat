
/* ============================================================
   Single Nav Item
============================================================ */

import { NavItem, Input, Badge, Menu, MenuTrigger, Button, MenuPopover, MenuList, MenuItem, MenuDivider, makeStyles } from "@fluentui/react-components";
import { MoreHorizontalRegular, EditRegular, ArrowExportRegular, DeleteRegular } from "@fluentui/react-icons";
import { IconToken } from "aihappey-types";
import React from "react";
import { iconMap } from "../Button";

type NavItemRowProps = {
  item: any;
  editingId: string | null;
  editValue: string;
  setEditingId: (v: string | null) => void;
  setEditValue: (v: string) => void;
  onSelect?: (key: string) => void;
  onRename?: (key: string, value: string) => Promise<void> | void;
  onDelete?: (key: string) => Promise<void> | void;
  onExport?: (key: string) => Promise<void> | void;
  translations?: Record<string, string>;
};

const useStyles = makeStyles({
  navItemContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
});
export const NavItemRow: React.FC<NavItemRowProps> = ({
  item,
  editingId,
  editValue,
  setEditingId,
  setEditValue,
  onSelect,
  onRename,
  onDelete,
  onExport,
  translations,
}) => {
  const styles = useStyles();
  const isEditing = editingId === item.key;

  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <NavItem
      key={item.key}
      style={{ paddingTop: 4, paddingBottom: 4 }}
      value={item.key}
      disabled={item.disabled}
      icon={
        item.icon && iconMap[item.icon as IconToken] ? (
          <span style={{ display: "flex", alignItems: "center" }}>
            {React.createElement(iconMap[item.icon as IconToken], {
              style: { fontSize: 24, display: "block" },
            })}
          </span>
        ) : null
      }
      onClick={() => (item.onClick ? item.onClick() : onSelect?.(item.key))}
    >
      {isEditing ? (
        onRename && (
          <Input
            autoFocus
            value={editValue}
            style={{ width: "100%" }}
            onChange={(e: any) => setEditValue(e.target.value)}
            onBlur={async () => {
              await onRename(item.key, editValue);
              setEditingId(null);
            }}
            onKeyDown={async (e: any) => {
              if (e.key === "Enter") {
                await onRename(item.key, editValue);
                setEditingId(null);
              }
            }}
          />
        )
      ) : (
        <span
          className={styles.navItemContent}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <span
            style={{
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              overflow: "hidden",
            }}
          >
            {item.label}
            {item.new && (
              <>
                {" "}
                <Badge color="informative" appearance="outline">
                  {translations?.new ?? "new"}
                </Badge>
              </>
            )}
          </span>

          {item.conversationItem && (
            <Menu>
              <MenuTrigger disableButtonEnhancement>
                <Button
                  size="small"
                  appearance="transparent"
                  icon={<MoreHorizontalRegular />}
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
                    icon={<EditRegular />}
                    onClick={e => {
                      e.stopPropagation();
                      setEditingId(item.key);
                      setEditValue(item.label as string);
                    }}
                  >
                    {translations?.rename ?? "rename"}
                  </MenuItem>

                  {onExport && (
                    <MenuItem
                      icon={<ArrowExportRegular />}
                      onClick={async e => {
                        e.stopPropagation();
                        await onExport(item.key);
                      }}
                    >
                      {translations?.export ?? "export"}
                    </MenuItem>
                  )}

                  <MenuDivider />

                  {onDelete && (
                    <MenuItem
                      icon={<DeleteRegular />}
                      onClick={async e => {
                        e.stopPropagation();
                        await onDelete(item.key);
                      }}
                    >
                      {translations?.delete ?? "delete"}
                    </MenuItem>
                  )}
                </MenuList>
              </MenuPopover>
            </Menu>
          )}
        </span>
      )}
    </NavItem>
  );
};
