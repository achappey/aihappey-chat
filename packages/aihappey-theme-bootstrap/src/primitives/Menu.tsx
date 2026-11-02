// BootstrapMenu.tsx
import React from "react";
import Dropdown from "react-bootstrap/Dropdown";
import { ThreeDotsVertical } from "react-bootstrap-icons"; // or your own icon
import type { MenuItemProps } from "aihappey-types";
import { getIcon } from "./IconMap";

const BootstrapMenuTrigger = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement> & { trigger: React.ReactElement }>(function BootstrapMenuTrigger(
  { trigger, ...props },
  ref
) {
  return React.cloneElement(trigger as React.ReactElement<any>, { ...props, ref });
});

export type MenuAction = {
  key: string;
  label: string;
  onClick?: () => void | Promise<void>;
  disabled?: boolean;
  danger?: boolean;
};

type BootstrapMenuProps = {
  actions?: MenuAction[];
  items?: MenuItemProps[];
  trigger?: React.ReactElement;
  align?: "left" | "right";
  direction?: "top" | "bottom";
  className?: string;
  icon?: React.ReactNode;
  buttonProps?: React.ComponentProps<"button">;
};

const renderItems = (items: MenuItemProps[], close: () => void) => items.map((item) => item.children?.length ? (
  <Submenu key={item.key} item={item} close={close} />
) : (
  <Dropdown.Item
    key={item.key}
    disabled={item.disabled}
    onClick={() => { close(); void item.onClick?.(); }}
    style={item.danger ? { color: "#dc3545" } : undefined}
  >
    {item.icon ? <span className="me-2">{getIcon(item.icon)}</span> : null}{item.label}
  </Dropdown.Item>
));

function Submenu({ item, close }: { item: MenuItemProps; close: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [left, setLeft] = React.useState(false);
  const trigger = React.useRef<HTMLButtonElement>(null);
  const menu = React.useRef<HTMLDivElement>(null);
  const show = () => {
    if (item.disabled) return;
    setLeft((trigger.current?.getBoundingClientRect().right ?? 0) + 220 > window.innerWidth);
    setOpen(true);
  };
  return <Dropdown drop={left ? "start" : "end"} show={open} onToggle={value => value ? show() : setOpen(false)}
    onMouseEnter={show} onMouseLeave={() => setOpen(false)}>
    <Dropdown.Toggle as="button" ref={trigger} disabled={item.disabled} className="dropdown-item d-flex align-items-center"
      onKeyDown={event => {
        if (event.key === "ArrowRight") {
          event.preventDefault(); event.stopPropagation(); show();
          requestAnimationFrame(() => menu.current?.querySelector<HTMLElement>(".dropdown-item:not(.disabled)")?.focus());
        }
      }}>
      {item.icon ? <span className="me-2">{getIcon(item.icon)}</span> : null}{item.label}
    </Dropdown.Toggle>
    <Dropdown.Menu ref={menu} renderOnMount={false} onKeyDown={event => {
      if (event.key === "ArrowLeft" || event.key === "Escape") {
        event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus();
      }
    }}>{renderItems(item.children ?? [], close)}</Dropdown.Menu>
  </Dropdown>;
}

export const Menu: React.FC<BootstrapMenuProps> = ({
  actions,
  items,
  trigger,
  align = "right",
  direction = "bottom",
  className,
  icon = <ThreeDotsVertical />,
  buttonProps,
}) => {
  const [open, setOpen] = React.useState(false);
  return <Dropdown show={open} onToggle={setOpen} align={align === "left" ? "start" : "end"} drop={direction === "top" ? "up" : "down"}>
    {trigger ? (
      <Dropdown.Toggle as={BootstrapMenuTrigger} trigger={trigger} className={className} />
    ) : (
      <Dropdown.Toggle
        as="button"
        variant="link"
        size="sm"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: 0 }}
        className={className}
        {...buttonProps}
      >
        {icon}
      </Dropdown.Toggle>
    )}
    <Dropdown.Menu>
      {open ? renderItems(items ?? actions ?? [], () => setOpen(false)) : null}
    </Dropdown.Menu>
  </Dropdown>;
};
