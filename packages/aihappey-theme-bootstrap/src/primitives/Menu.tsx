// BootstrapMenu.tsx
import React from "react";
import Dropdown from "react-bootstrap/Dropdown";
import { ThreeDotsVertical } from "react-bootstrap-icons"; // or your own icon

export type MenuAction = {
  key: string;
  label: string;
  onClick: () => void | Promise<void>;
  danger?: boolean;
};

type BootstrapMenuProps = {
  actions: MenuAction[];
  icon?: React.ReactNode;
  buttonProps?: React.ComponentProps<"button">;
};

export const Menu: React.FC<BootstrapMenuProps> = ({
  actions,
  icon = <ThreeDotsVertical />,
  buttonProps,
}) => (
  <Dropdown>
    <Dropdown.Toggle
      as="button"
      variant="link"
      size="sm"
      onClick={(e) => e.stopPropagation()}
      style={{ padding: 0 }}
    >
      {icon}
    </Dropdown.Toggle>
    <Dropdown.Menu>
      {actions.map(({ key, label, onClick, danger }) => (
        <Dropdown.Item
          key={key}
          onClick={onClick}
          style={danger ? { color: "#dc3545" } : undefined}
        >
          {label}
        </Dropdown.Item>
      ))}
    </Dropdown.Menu>
  </Dropdown>
);
