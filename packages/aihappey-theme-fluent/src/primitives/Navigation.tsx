import * as React from "react";
import {
  ArrowExportRegular,
  Cloud24Regular,
  Database24Regular,
  DeleteRegular,
  EditRegular,
  MoreHorizontalRegular,
} from "@fluentui/react-icons";
import {
  AppItem,
  Button,
  Hamburger,
  Input,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  NavDivider,
  NavSubItemGroup,
  NavDrawer,
  NavCategory,
  NavCategoryItem,
  NavSubItem,
  NavDrawerBody,
  NavDrawerHeader,
  NavItem,
  NavSectionHeader,
  Tooltip,
  MenuDivider,
} from "@fluentui/react-components";
import { makeStyles } from "@fluentui/react-components";
import { IconToken, NavigationProps } from "aihappey-types";
import { useState } from "react";
import { iconMap } from "./Button";

const useStyles = makeStyles({
  root: {
    overflow: "hidden",
    display: "flex",
    height: "100%",
    flexDirection: "column",
  },
  nav: { minWidth: "220px", height: "100%" },
  headerBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  rightIcons: { display: "flex", alignItems: "center" },
  iconBtn: {
    cursor: "pointer",
    background: "none",
    border: "none",
    color: "inherit",
  },
  navItemContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
});

export const Navigation: React.FC<NavigationProps> = ({
  items,
  activeKey,
  onSelect,
  storageType = "local",
  onStorageSwitch,
  onDelete,
  onExport,
  onClose,
  isOpen,
  translations,
  onRename,
  multiple = false,
  drawerType = "inline",
  className,
  style,
}) => {
  const styles = useStyles();
  //const [open, setOpen] = React.useState(isOpen);

  const appItem = items.length && items[0].key === "app" ? items[0] : null;
  const navItems = appItem ? items.slice(1) : items;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Icon for storage
  const StorageIcon =
    storageType === "local" ? Database24Regular : Cloud24Regular;

  return (
    <div className={styles.root} style={style}>
      <NavDrawer
        open={isOpen}
        type={drawerType}
        multiple={multiple}
        onOpenChange={
          onClose
            ? (event, data) => (data.open ? undefined : onClose())
            : undefined
        }
        size="small"
        defaultSelectedValue={activeKey}
        className={styles.nav + (className ? " " + className : "")}
      >
        <NavDrawerHeader>
          <div className={styles.headerBar}>
            {/* Hamburger left */}
            <Tooltip relationship="label" content="Close navigation">
              <span>
                <Hamburger onClick={onClose} />
              </span>
            </Tooltip>
            {/* Right icon buttons */}
            <div className={styles.rightIcons}>
              {/* Storage Switch */}
              {onStorageSwitch != undefined ? (
                <Tooltip
                  relationship="label"
                  content={`Opslag: ${storageType === "local" ? "Lokaal" : "Cloud"
                    }`}
                >
                  <Button
                    aria-label="Wissel opslag"
                    icon={<StorageIcon />}
                    appearance="transparent"
                    onClick={() => {
                      onStorageSwitch(
                        storageType === "local" ? "remote" : "local"
                      );
                    }}
                    type="button"
                  ></Button>
                </Tooltip>
              ) : null}
            </div>
          </div>
        </NavDrawerHeader>
        <NavDrawerBody>
          {appItem && (
            <AppItem as="a" href={appItem.href}>
              {appItem.label}
            </AppItem>
          )}
          {navItems.map((item, idx) =>
            item.key === "divider" ? (
              <NavDivider key={idx} />
            ) : item.key.startsWith("section:") ? (
              <NavSectionHeader key={item.key}>{item.label}</NavSectionHeader>
            ) : item.key === "category" ? (
              <NavCategory key={idx} value={idx.toString()}>
                <NavCategoryItem
                  style={{
                    paddingTop: 4,
                    paddingBottom: 4,
                  }}
                  icon={
                    item.icon && iconMap[item.icon as IconToken] ? (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
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
                  {item.children.map((b: any, idx: number) => (
                    <NavSubItem
                      key={idx}
                      onClick={() =>
                        b.onClick ? b.onClick() : onSelect && onSelect(b.key)
                      }
                      value={b.key}
                    >
                      {b.label}
                    </NavSubItem>
                  ))}
                </NavSubItemGroup>
              </NavCategory>
            ) : (
              <NavItem
                key={item.key}
                style={{ paddingTop: 4, paddingBottom: 4 }}
                icon={
                  item.icon && iconMap[item.icon as IconToken] ? (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {React.createElement(iconMap[item.icon as IconToken], {
                        style: { fontSize: 24, display: "block" },
                      })}
                    </span>
                  ) : null
                }
                value={item.key}
                disabled={item.disabled}
                onClick={() =>
                  item.onClick ? item.onClick() : onSelect && onSelect(item.key)
                }
              >
                {editingId === item.key ? (
                  <>
                    {onRename && (
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
                          if (e.key === "Enter")
                            await onRename(item.key, editValue);
                        }}
                      />
                    )}
                  </>
                ) : (
                  <span className={styles.navItemContent}>
                    <Tooltip relationship="label" content={<>{item.label}</>}>
                      <span
                        style={{
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                          overflow: "hidden",
                        }}
                      >
                        {item.label}
                      </span>
                    </Tooltip>
                    {item.conversationItem && (
                      <Menu>
                        <MenuTrigger disableButtonEnhancement>
                          <Button
                            size="small"
                            appearance="transparent"
                            icon={<MoreHorizontalRegular />}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </MenuTrigger>
                        <MenuPopover>
                          <MenuList>
                            <MenuItem
                              icon={<EditRegular />}
                              onClick={(e) => {
                                setEditingId(item.key)
                                setEditValue(item.label as string)
                                e.stopPropagation();
                              }}
                            >
                              {translations?.rename ?? "rename"}
                            </MenuItem>
                            {onExport && (
                              <MenuItem
                                icon={<ArrowExportRegular />}
                                onClick={async (e) => {
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
                                onClick={async (e) => {
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
            )
          )}
        </NavDrawerBody>
      </NavDrawer>
    </div>
  );
};

export default Navigation;
