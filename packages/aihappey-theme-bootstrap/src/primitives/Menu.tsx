// BootstrapMenu.tsx
import React from "react";
import Dropdown from "react-bootstrap/Dropdown";
import { ThreeDotsVertical } from "react-bootstrap-icons"; // or your own icon
import type { MenuItemProps } from "aihappey-types";

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

const renderItems = (items: MenuAction[]) => items.map(({ key, label, onClick, disabled, danger }) => (
  <Dropdown.Item
    key={key}
    disabled={disabled}
    onClick={onClick}
    style={danger ? { color: "#dc3545" } : undefined}
  >
    {label}
  </Dropdown.Item>
));

export const Menu: React.FC<BootstrapMenuProps> = ({
  actions,
  items,
  trigger,
  align = "right",
  direction = "bottom",
  className,
  icon = <ThreeDotsVertical />,
  buttonProps,
}) => (
  <Dropdown align={align === "left" ? "start" : "end"} drop={direction === "top" ? "up" : "down"}>
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
      {renderItems((items ?? actions ?? []) as MenuAction[])}
    </Dropdown.Menu>
  </Dropdown>
);
