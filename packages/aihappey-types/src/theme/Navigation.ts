import type * as React from "react";
import type { JSX } from "react";

import type { IconToken } from "./IconToken";

export interface NavigationItem {
  key: string;
  label: string | React.ReactNode;
  icon?: IconToken;
  href?: string;
  disabled?: boolean;
  conversationItem?: boolean;
  onClick?: any;
  eventKey?: string;
  [key: string]: any;
}

export interface NavigationProps {
  items: NavigationItem[];
  activeKey?: string;
  onClose?: () => void;
  onSelect?: (key: string) => void;
  isOpen?: boolean;
  onNewChat?: () => void;
  storageType?: "local" | "remote";
  onStorageSwitch?: (newType: "local" | "remote") => void;
  multiple?: boolean;
  drawerType?: "inline" | "overlay";
  className?: string;
  onDelete?: (id: string) => Promise<void>;
  onExport?: (id: string) => Promise<void>;
  onRename?: (id: string, newName: string) => Promise<void>;
  style?: React.CSSProperties;
}

export type NavigationComponent = (props: NavigationProps) => JSX.Element;
