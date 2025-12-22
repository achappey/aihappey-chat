import * as React from "react";
import Nav from "react-bootstrap/Nav";
import Offcanvas from "react-bootstrap/Offcanvas";
import Button from "react-bootstrap/Button";
import { NavigationProps, NavigationItem } from "aihappey-types/src/theme";
import { Plus, Cloud, Hdd } from "react-bootstrap-icons"; // Bootstrap icons

const isSection = (item: NavigationItem) => item.key.startsWith("section:");
const isDivider = (item: NavigationItem) => item.key === "divider";

const renderNavItems = (
  items: NavigationItem[],
  activeKey?: string,
  onSelect?: (key: string) => void
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
          <Nav.Link disabled className="fw-bold text-muted">
            {item.label}
          </Nav.Link>
        </Nav.Item>
      );
    }
    return (
      <Nav.Link
        key={item.key}
        eventKey={item.key}
        href={item.href}
        disabled={item.disabled}
        active={activeKey === item.key}
        onClick={() => onSelect && onSelect(item.key)}
      >
        {item.label}
      </Nav.Link>
    );
  });

export const Navigation: React.FC<NavigationProps> = ({
  items,
  activeKey,
  onSelect,
  onNewChat,
  storageType = "local",
  onStorageSwitch,
  multiple,
  drawerType = "inline",
  className,
  style,
}) => {
  const [show, setShow] = React.useState(drawerType === "overlay" ? true : undefined);

  const StorageIcon = storageType === "local" ? Hdd : Cloud;

  // --- Overlay (Offcanvas)
  if (drawerType === "overlay") {
    return (
      <div className={className} style={style}>
        <Button
          variant="light"
          aria-label="Open navigation"
          onClick={() => setShow(true)}
          className="mb-2"
        >
          &#9776;
        </Button>
        <Offcanvas show={!!show} onHide={() => setShow(false)} placement="start">
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>Navigation</Offcanvas.Title>
            <div className="d-flex align-items-center gap-2 ms-auto">
              <Button variant="link" aria-label="Nieuw chat" onClick={onNewChat}>
                <Plus size={20} />
              </Button>
              <Button
                variant="link"
                aria-label="Wissel opslag"
                onClick={() =>
                  onStorageSwitch?.(storageType === "local" ? "remote" : "local")
                }
              >
                <StorageIcon size={20} />
              </Button>
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
    <div className={className} style={style}>
      <div className="d-flex align-items-center justify-content-between px-2 py-2">
        <span style={{ fontWeight: 600 }}>Chats</span>
        <div className="d-flex gap-2">
          {onNewChat && (
            <Button variant="link" aria-label="Nieuw chat" onClick={onNewChat}>
              <Plus size={20} />
            </Button>
          )}
          <Button
            variant="link"
            aria-label="Wissel opslag"
            onClick={() =>
              onStorageSwitch?.(storageType === "local" ? "remote" : "local")
            }
          >
            <StorageIcon size={20} />
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
