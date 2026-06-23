import * as React from "react";
import { Avatar, AvatarGroup as MuiAvatarGroup, Tooltip } from "@mui/material";
import type { AvatarGroupComponent, AvatarGroupItemProps, AvatarGroupPopoverProps, AvatarGroupProps, AvatarProps } from "aihappey-types";

const avatarSize = (size?: number) => size ?? 32;

export const AvatarGroup = (({ children, layout, size, style, ...rest }: AvatarGroupProps) => (
  <MuiAvatarGroup spacing={layout === "spread" ? "medium" : "small"} sx={style} {...rest as any}>
    {React.Children.map(children, (child) => {
      if (!React.isValidElement<any>(child)) return child;
      const avatarChild = child as React.ReactElement<any>;
      return React.cloneElement(avatarChild, { size: avatarChild.props.size ?? size } as any);
    })}
  </MuiAvatarGroup>
)) as AvatarGroupComponent;

AvatarGroup.Avatar = ({ image, icon, initials, name, shape, size, children, ...rest }: AvatarProps) => (
  <Avatar src={image?.src} alt={image?.alt ?? name} variant={shape === "square" ? "rounded" : "circular"} sx={{ width: avatarSize(size), height: avatarSize(size), fontSize: Math.max(10, avatarSize(size) / 2.4) }} {...rest as any}>
    {children ?? icon ?? initials ?? name?.slice(0, 2).toUpperCase()}
  </Avatar>
);

AvatarGroup.Item = ({ overflowLabel, ...props }: AvatarGroupItemProps) => <Tooltip title={overflowLabel ?? props.name ?? props.initials ?? ""}><span><AvatarGroup.Avatar {...props} /></span></Tooltip>;

AvatarGroup.Popover = ({ children, count, indicator, size, overflowLabel, ...rest }: AvatarGroupPopoverProps & { size?: number; overflowLabel?: string }) => {
  const hiddenLabels = React.Children.toArray(children).map((child) => {
    if (!React.isValidElement<any>(child)) return undefined;
    const props = child.props as any;
    return props.overflowLabel ?? props.name ?? props.title;
  }).filter(Boolean).join("\n");
  return <Tooltip title={overflowLabel ?? hiddenLabels ?? `+${count ?? 0}`}><Avatar sx={{ width: avatarSize(size), height: avatarSize(size), fontSize: Math.max(10, avatarSize(size) / 2.4), fontWeight: 700 }} {...rest as any}>+{count ?? 0}</Avatar></Tooltip>;
};

AvatarGroup.partitionItems = <T,>({ items, maxInlineItems = 5 }: { items: readonly T[]; maxInlineItems?: number }) => ({ inlineItems: items.slice(0, maxInlineItems), overflowItems: items.length > maxInlineItems ? items.slice(maxInlineItems) : undefined });

