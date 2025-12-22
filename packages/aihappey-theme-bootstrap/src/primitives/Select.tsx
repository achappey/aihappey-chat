import * as React from "react";
import Dropdown from "react-bootstrap/Dropdown";

interface SelectProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
  children: React.ReactNode;
  style?: React.CSSProperties;
  "aria-label"?: string;
}

function renderBootstrapOptions(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return null;
    const el = child as React.ReactElement<any>;

    if (el.type === React.Fragment) {
      return renderBootstrapOptions(el.props.children);
    }
    if (el.type === "option") {
      return (
        <Dropdown.Item
          key={el.props.value}
          eventKey={el.props.value}
          active={el.props.selected}
          disabled={el.props.disabled}
        >
          {el.props.children}
        </Dropdown.Item>
      );
    } else if (el.type === "optgroup") {
      return (
        <React.Fragment key={el.props.label}>
          <Dropdown.Header>{el.props.label}</Dropdown.Header>
          {renderBootstrapOptions(el.props.children)}
        </React.Fragment>
      );
    }
    return null;
  });
}

function findLabel(children: React.ReactNode, value: string): string {
  let result: string | null = null;
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const el = child as React.ReactElement<any>;
    if (el.type === React.Fragment) {
      const inner = findLabel(el.props.children, value);
      if (inner) result = inner;
    } else if (el.type === "option") {
      if (el.props.value === value) result = el.props.children;
    } else if (el.type === "optgroup") {
      const inner = findLabel(el.props.children, value);
      if (inner) result = inner;
    }
  });
  return typeof result === "string" ? result : value;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  disabled,
  size,
  children,
  style,
  "aria-label": ariaLabel,
  ...bsProps
}) => {
  const label = findLabel(children, value);
  const bsSize = size === "small" ? "sm" : size === "large" ? "lg" : undefined;

  return (
    <Dropdown onSelect={(k) => k && onChange(k as string)} {...bsProps}>
      <Dropdown.Toggle
        variant="outline-secondary"
        size={bsSize}
        disabled={disabled}
        style={style}
        aria-label={ariaLabel}
      >
        {label}
      </Dropdown.Toggle>
      <Dropdown.Menu>{renderBootstrapOptions(children)}</Dropdown.Menu>
    </Dropdown>
  );
};
