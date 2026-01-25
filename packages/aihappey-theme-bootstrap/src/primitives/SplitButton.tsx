// BootstrapSplitButton.tsx
import * as React from "react";
import Dropdown from "react-bootstrap/Dropdown";
import ButtonGroup from "react-bootstrap/ButtonGroup";

import type { SplitButtonProps, SplitButtonMenuItem } from "aihappey-types";
import { iconMap } from "./IconMap";
import { JSX } from "react";

type RenderOpts = { stopPropagation: boolean; depth?: number };

function renderItems(
  items: SplitButtonMenuItem[],
  opts: RenderOpts = { stopPropagation: true, depth: 0 }
): React.ReactNode[] {
  const depth = opts.depth ?? 0;

  return items.flatMap<React.ReactNode>((item) => {
    const Icon = item.icon ? iconMap[item.icon] : undefined;

    const handleClick: React.MouseEventHandler<HTMLElement> = async (e) => {
      if (opts.stopPropagation) e.stopPropagation();
      if (item.disabled) return;

      // SplitButtonMenuItem.onClick is (e?: SyntheticEvent) in your shared types
      await item.onClick?.(e);
    };

    const base: React.ReactNode = (
      <Dropdown.Item
        key={item.key}
        onClick={handleClick}
        disabled={item.disabled}
        style={{
          ...(item.danger ? { color: "#dc3545" } : undefined),
          ...(depth > 0 ? { paddingLeft: `${12 + depth * 14}px` } : undefined),
        }}
      >
        {Icon && <span className="me-2">{Icon}</span>}
        {item.label}
      </Dropdown.Item>
    );

    if (!item.children?.length) return [base];

    return [
      <Dropdown.Divider key={`${item.key}__div`} />,
      <Dropdown.Header key={`${item.key}__hdr`}>{item.label}</Dropdown.Header>,
      ...renderItems(item.children, { ...opts, depth: depth + 1 }),
    ];
  });
}
// replace: export const SplitButton: React.FC<SplitButtonProps> = (...) => {
export function SplitButton(props: SplitButtonProps): JSX.Element {
  const {
    label,
    onClick,
    menuItems,
    variant = "primary",
    size = "small",
    disabled,
    icon,
    iconPosition = "left",
    align = "right",
    className,
    stopPropagation = true,
  } = props;

  const Icon = icon ? iconMap[icon] : undefined;

  const handlePrimaryClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    if (stopPropagation) e.stopPropagation();
    onClick?.(e);
  };

  const bsSize = size === "small" || size === "sm" ? "sm" : size === "large" || size === "lg" ? "lg" : "sm";

  return (
    <Dropdown as={ButtonGroup} align={align === "right" ? "end" : undefined} className={className}>
      <Dropdown.Toggle
        split={false}
        variant={variant as any}
        size={bsSize as any}
        disabled={disabled}
        onClick={handlePrimaryClick}
      >
        {Icon && iconPosition === "left" && <span className="me-2">{Icon}</span>}
        {label}
        {Icon && iconPosition === "right" && <span className="ms-2">{Icon}</span>}
      </Dropdown.Toggle>

      <Dropdown.Toggle
        split
        variant={variant as any}
        size={bsSize as any}
        disabled={disabled}
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          if (stopPropagation) e.stopPropagation();
        }}
      />

      <Dropdown.Menu>{renderItems(menuItems, { stopPropagation })}</Dropdown.Menu>
    </Dropdown>
  );
}
