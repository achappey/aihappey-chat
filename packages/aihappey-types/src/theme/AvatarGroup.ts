import type * as React from "react";
import type { JSX } from "react";

export type AvatarGroupLayout = "spread" | "stack" | "pie";

export type AvatarSize =
  | 16
  | 20
  | 24
  | 28
  | 32
  | 36
  | 40
  | 48
  | 56
  | 64
  | 72
  | 96
  | 120
  | 128;

export type AvatarGroupProps = React.ComponentProps<"div"> & {
  layout?: AvatarGroupLayout;
  size?: AvatarSize;
};

export type AvatarProps = React.ComponentProps<"span"> & {
  image?: { src?: string; alt?: string } & React.ImgHTMLAttributes<HTMLImageElement>;
  icon?: React.ReactNode;
  initials?: React.ReactNode;
  name?: string;
  shape?: "circular" | "square";
  size?: AvatarSize;
};

export type AvatarGroupItemProps = AvatarProps & {
  overflowLabel?: React.ReactNode;
  root?: any;
};

export type AvatarGroupPopoverProps = Omit<React.ComponentProps<"div">, "children"> & {
  children?: React.ReactNode;
  count?: number;
  indicator?: "icon" | "count";
  tooltip?: { content?: React.ReactNode; relationship?: string };
};

export type AvatarGroupComponent = ((props: AvatarGroupProps) => JSX.Element) & {
  Avatar: (props: AvatarProps) => JSX.Element;
  Item: (props: AvatarGroupItemProps) => JSX.Element;
  Popover: (props: AvatarGroupPopoverProps) => JSX.Element;
  partitionItems: <T>(options: {
    items: readonly T[];
    layout?: AvatarGroupLayout;
    maxInlineItems?: number;
  }) => { inlineItems: readonly T[]; overflowItems?: readonly T[] };
};
