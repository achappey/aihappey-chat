import * as React from "react";
import { useState } from "react";
import {
  AppItem,
  NavDivider,
  NavDrawer,
  NavDrawerBody,
  NavSectionHeader,
} from "@fluentui/react-components";
import { makeStyles } from "@fluentui/react-components";
import { NavigationProps } from "aihappey-types";
import { NavigationHeader } from "./NavigationHeader";
import { NavigationCategorySection } from "./NavigationCategorySection";
import { NavItemRow } from "./NavigationItemRow";

/* ============================================================
   Styles
============================================================ */

const useStyles = makeStyles({
  root: {
    overflow: "hidden",
    display: "flex",
    height: "100%",
    flexDirection: "column",
  },
  nav: { minWidth: "220px", height: "100%" }
});

/* ============================================================
   Main Navigation
============================================================ */

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
  onTogglePin,
  translations,
  onRename,
  multiple = false,
  drawerType = "inline",
  className,
  style,
}) => {
  const styles = useStyles();

  const appItem = items.length && items[0].key === "app" ? items[0] : null;
  const navItems = appItem ? items.slice(1) : items;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  return (
    <div className={styles.root} style={style}>
      <NavDrawer
        open={isOpen}
        type={drawerType}
        multiple={multiple}
        size="small"
        defaultSelectedValue={activeKey}
        className={styles.nav + (className ? " " + className : "")}
        onOpenChange={
          onClose
            ? (_e, data) => {
              if (!data.open) onClose();
            }
            : undefined
        }
      >
        <NavigationHeader
          storageType={storageType}
          onClose={onClose}
          onStorageSwitch={onStorageSwitch}
          translations={translations}
        />

        <NavDrawerBody>
          {appItem && (
            <AppItem as="a" href={appItem.href}>
              {appItem.label}
            </AppItem>
          )}

          {navItems.map((item: any, idx: number) => {
            if (item.key === "divider") return <NavDivider key={idx} />;

            if (item.key.startsWith("section:")) {
              return (
                <NavSectionHeader key={item.key}>
                  {item.label}
                </NavSectionHeader>
              );
            }

            if (item.key === "category") {
              return (
                <NavigationCategorySection
                  key={idx}
                  item={item}
                  onSelect={onSelect}
                />
              );
            }

            return (
              <NavItemRow
                key={item.key}
                item={item}
                editingId={editingId}
                editValue={editValue}
                setEditingId={setEditingId}
                setEditValue={setEditValue}
                onSelect={onSelect}
                onTogglePin={onTogglePin}
                onRename={onRename}
                onDelete={onDelete}
                onExport={onExport}
                translations={translations}
              />
            );
          })}
        </NavDrawerBody>
      </NavDrawer>
    </div>
  );
};

export default Navigation;
