import * as React from "react";
import Nav from "react-bootstrap/Nav";
import Offcanvas from "react-bootstrap/Offcanvas";
import Button from "react-bootstrap/Button";
import { NavigationProps, NavigationItem } from "aihappey-types/src/theme";
import { Plus, Cloud, Hdd, List } from "react-bootstrap-icons"; // Bootstrap icons
import { useDarkMode } from "usehooks-ts";
import { iconMap } from "./IconMap";

const isSection = (item: NavigationItem) => item.key.startsWith("section:");
const isDivider = (item: NavigationItem) => item.key === "divider";

const renderNavItems = (
  items: NavigationItem[],
  activeKey?: string,
  onSelect?: (key: string) => void,
  level = 0
) =>
  items.map((item, idx) => {
    if (isDivider(item)) {
      return (
        <Nav.Item key={idx}>
          <hr className="dropdown-divider" />
        </Nav.Item>
      );
    }
    if (isSection(item)) {
      return (
        <Nav.Item key={item.key}>
          <Nav.Link disabled className="fw-bold text-muted d-flex align-items-center gap-2">
            {item.icon && iconMap[item.icon] ? <span className="d-inline-flex">{iconMap[item.icon]}</span> : null}
            {item.label}
          </Nav.Link>
        </Nav.Item>
      );
    }
    if (item.children?.length) {
      return (
        <React.Fragment key={`${item.key}:${idx}`}>
          <Nav.Item>
            <Nav.Link disabled className="fw-bold text-muted d-flex align-items-center gap-2">
              {item.icon && iconMap[item.icon] ? <span className="d-inline-flex">{iconMap[item.icon]}</span> : null}
              {item.label}
            </Nav.Link>
          </Nav.Item>
          {renderNavItems(item.children, activeKey, onSelect, level + 1)}
        </React.Fragment>
      );
    }
    const itemValue = item.key ?? item.eventKey;
    const selected = !!activeKey && itemValue === activeKey;
    return (
      <Nav.Link
        key={item.key}
        eventKey={itemValue}
        href={item.href}
        disabled={item.disabled}
        active={selected}
        className="d-flex align-items-center gap-2"
        onClick={(event) => {
          event.preventDefault();
          if (item.onClick) {
            item.onClick();
            return;
          }
          if (itemValue) onSelect?.(itemValue);
        }}
        style={{ paddingLeft: level > 0 ? `${1 + level * 1.25}rem` : undefined }}
      >
        {item.icon && iconMap[item.icon] ? <span className="d-inline-flex flex-shrink-0">{iconMap[item.icon]}</span> : null}
        <span className="min-w-0 flex-grow-1 text-truncate">{item.label}</span>
        {item.badge ? <small className="ms-auto flex-shrink-0 opacity-75">{item.badge}</small> : null}
      </Nav.Link>
    );
  });

export const Navigation: React.FC<NavigationProps> = ({
  items,
  appTitle,
  activeKey,
  onSelect,
  onNewChat,
  onClose,
  storageType = "local",
  onStorageSwitch,
  multiple,
  drawerType = "inline",
  className,
  style,
}) => {
  const [show, setShow] = React.useState(drawerType === "overlay" ? true : undefined);
  const { isDarkMode } = useDarkMode();
  const title = appTitle ?? "AIHappey";
  const navstyle = {
    ...style,
    backgroundColor: isDarkMode ? "#1b1f22" : "rgb(248, 249, 250)"
  }
  
  const StorageIcon = storageType === "local" ? Hdd : Cloud;

  // --- Overlay (Offcanvas)
  if (drawerType === "overlay") {
    return (
      <div className={className} style={navstyle}>
        <Button variant="link" aria-label="Open navigation" onClick={() => setShow(true)} className="mb-2">
          <List size={24} />
        </Button>
        <Offcanvas show={!!show} onHide={() => setShow(false)} placement="start">
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>{title}</Offcanvas.Title>
            <div className="d-flex align-items-center gap-2 ms-auto">
              <Button variant="link" aria-label="Nieuw chat" onClick={onNewChat}>
                <Plus size={20} />
              </Button>
              {onStorageSwitch && (
                <Button
                  variant="link"
                  aria-label="Wissel opslag"
                  onClick={() =>
                    onStorageSwitch(storageType === "local" ? "remote" : "local")
                  }
                >
                  <StorageIcon size={20} />
                </Button>
              )}
            </div>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <Nav
              variant="pills"
              className="flex-column"
              activeKey={activeKey}
              onSelect={(k) => k && onSelect && onSelect(k as string)}
            >
              {renderNavItems(items, activeKey, onSelect)}
            </Nav>
          </Offcanvas.Body>
        </Offcanvas>
      </div>
    );
  }

  // --- Inline (Sidebar)
  return (
    <div className={className} style={navstyle}>
      <div className="d-flex align-items-center justify-content-between px-3 py-2" style={{ minHeight: 48 }}>
        <div
          className="fw-semibold fs-5 text-truncate"
          title={title}
          style={{ lineHeight: "2rem" }}
        >
          {title}
        </div>
        <div className="d-flex align-items-center gap-1 flex-shrink-0">
          {onStorageSwitch && (
            <Button
              variant="link"
              aria-label="Wissel opslag"
              onClick={() =>
                onStorageSwitch(storageType === "local" ? "remote" : "local")
              }
              className="p-1"
              style={{ width: 32, height: 32, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
            >
              <StorageIcon size={20} />
            </Button>
          )}
          <Button
            variant="link"
            aria-label="Close navigation"
            onClick={onClose}
            className="p-1"
            style={{ width: 32, height: 32, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
          >
            <List size={24} />
          </Button>
        </div>
      </div>
      <Nav
        variant="pills"
        className="flex-column"
        activeKey={activeKey}
        onSelect={(k) => k && onSelect && onSelect(k as string)}
      >
        {renderNavItems(items, activeKey, onSelect)}
      </Nav>
    </div>
  );
};

export default Navigation;
