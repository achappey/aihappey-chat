import type * as React from "react";
import type { JSX } from "react";

import type { IconToken } from "./IconToken";

export interface TagGroup {
  items?: TagItem[];
  size?: "extra-small" | "small" | "medium";
  onRemove?: (id: any) => Promise<void> | void;
}

export interface TagItem {
  key: string;
  icon?: IconToken;
  image?: string;
  label: string | React.ReactNode;
}

export type TagsComponent = (props: TagGroup) => JSX.Element;
