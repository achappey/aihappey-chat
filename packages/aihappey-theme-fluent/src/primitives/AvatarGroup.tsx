import {
  Avatar as FluentAvatar,
  AvatarGroup as FluentAvatarGroup,
  AvatarGroupItem as FluentAvatarGroupItem,
  AvatarGroupPopover as FluentAvatarGroupPopover,
  partitionAvatarGroupItems,
} from "@fluentui/react-components";
import type {
  AvatarGroupComponent,
  AvatarGroupItemProps,
  AvatarGroupPopoverProps,
  AvatarGroupProps,
  AvatarProps,
} from "aihappey-types";

export const Avatar = (props: AvatarProps) => <FluentAvatar {...(props as any)} />;

export const AvatarGroupItem = (props: AvatarGroupItemProps) => (
  <FluentAvatarGroupItem {...(props as any)} />
);

export const AvatarGroupPopover = (props: AvatarGroupPopoverProps) => (
  <FluentAvatarGroupPopover {...(props as any)}>
    {props.children}
  </FluentAvatarGroupPopover>
);

export const AvatarGroup = ((props: AvatarGroupProps) => (
  <FluentAvatarGroup {...(props as any)} />
)) as AvatarGroupComponent;

AvatarGroup.Avatar = Avatar;
AvatarGroup.Item = AvatarGroupItem;
AvatarGroup.Popover = AvatarGroupPopover;
AvatarGroup.partitionItems = partitionAvatarGroupItems as unknown as AvatarGroupComponent["partitionItems"];
