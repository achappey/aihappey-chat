import React from "react";
import { Dropdown } from "react-bootstrap";
import type {
  AvatarGroupComponent,
  AvatarGroupItemProps,
  AvatarGroupPopoverProps,
  AvatarGroupProps,
  AvatarProps,
} from "aihappey-types";

const defaultSize = 32;

const getInitials = (name?: string) =>
  name
    ?.trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

export const Avatar = ({
  image,
  icon,
  initials,
  name,
  shape = "circular",
  size = defaultSize,
  style,
  ...rest
}: AvatarProps) => (
  <span
    title={name}
    aria-label={name}
    style={{
      width: size,
      height: size,
      minWidth: size,
      borderRadius: shape === "square" ? 4 : "50%",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      background: "var(--bs-secondary-bg, #e9ecef)",
      border: "1px solid var(--bs-body-bg, #fff)",
      color: "var(--bs-body-color, #212529)",
      fontSize: Math.max(10, Math.floor(size * 0.38)),
      fontWeight: 600,
      lineHeight: 1,
      ...style,
    }}
    {...rest}
  >
    {image?.src ? (
      <img
        alt={image.alt ?? name ?? ""}
        {...image}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          ...(image.style ?? {}),
        }}
      />
    ) : (
      icon ?? initials ?? getInitials(name)
    )}
  </span>
);

export const AvatarGroupItem = ({ overflowLabel, root, ...props }: AvatarGroupItemProps) => (
  <Avatar {...props} />
);

export const AvatarGroupPopover = ({
  count,
  indicator = "count",
  title,
  style,
  children,
  tooltip,
  ...rest
}: AvatarGroupPopoverProps) => {
  const label = indicator === "icon" ? "…" : `+${count ?? React.Children.count(children)}`;
  const titleValue = title ?? (typeof tooltip?.content === "string" ? tooltip.content : undefined);

  if (!children) {
    return (
      <span
        title={titleValue}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 20,
          minHeight: 20,
          padding: "0 4px",
          borderRadius: 999,
          background: "var(--bs-secondary-bg, #e9ecef)",
          border: "1px solid var(--bs-body-bg, #fff)",
          fontSize: 11,
          fontWeight: 600,
          lineHeight: 1,
          ...style,
        }}
        {...rest}
      >
        {label}
      </span>
    );
  }

  return (
    <Dropdown as="span" align="end" title={titleValue} {...(rest as any)}>
      <Dropdown.Toggle
        as="button"
        type="button"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 20,
          minHeight: 20,
          padding: "0 4px",
          borderRadius: 999,
          background: "var(--bs-secondary-bg, #e9ecef)",
          border: "1px solid var(--bs-body-bg, #fff)",
          color: "inherit",
          fontSize: 11,
          fontWeight: 600,
          lineHeight: 1,
          ...style,
        }}
      >
        {label}
      </Dropdown.Toggle>
      <Dropdown.Menu style={{ minWidth: 220, padding: 6 }}>
        {React.Children.map(children, (child, index) => {
          if (!React.isValidElement(child)) return child;

          return (
            <Dropdown.Item
              as="button"
              type="button"
              key={(child as React.ReactElement<any>).key ?? index}
              onClick={(event) => (child.props as any).onClick?.(event)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 8px",
              }}
            >
              {React.cloneElement(child as React.ReactElement<any>, {
                size: (child.props as any).size ?? 20,
                onClick: undefined,
                style: {
                  cursor: "pointer",
                  ...(child.props as any).style,
                },
              })}
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                {(child.props as any).overflowLabel ?? (child.props as any).name ?? (child.props as any).title}
              </span>
            </Dropdown.Item>
          );
        })}
      </Dropdown.Menu>
    </Dropdown>
  );
};

const partitionItems: AvatarGroupComponent["partitionItems"] = ({
  items,
  layout,
  maxInlineItems,
}) => {
  const limit = maxInlineItems ?? (layout === "pie" ? 3 : 5);
  const inlineItems = items.slice(0, limit);
  const overflowItems = items.length > limit ? items.slice(limit) : undefined;
  return { inlineItems, overflowItems };
};

export const AvatarGroup = (({
  layout = "spread",
  size = defaultSize,
  style,
  children,
  ...rest
}: AvatarGroupProps) => (
  <div
    role="group"
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: layout === "spread" ? 2 : 0,
      height: size,
      ...style,
    }}
    {...rest}
  >
    {React.Children.map(children, (child, index) => {
      if (!React.isValidElement(child)) return child;

      return React.cloneElement(child as React.ReactElement<any>, {
        size: (child.props as any).size ?? size,
        style: {
          marginLeft: layout === "spread" || index === 0 ? 0 : Math.floor(size * -0.28),
          zIndex: React.Children.count(children) - index,
          ...(child.props as any).style,
        },
      });
    })}
  </div>
)) as AvatarGroupComponent;

AvatarGroup.Avatar = Avatar;
AvatarGroup.Item = AvatarGroupItem;
AvatarGroup.Popover = AvatarGroupPopover;
AvatarGroup.partitionItems = partitionItems;
