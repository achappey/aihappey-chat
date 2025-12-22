import type * as React from "react";
import type { JSX } from "react";

// Drawer/Offcanvas cross-framework types
export type DrawerPosition = "start" | "end" | "top" | "bottom";
export type DrawerSize = "small" | "medium" | "large" | "full";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  headerNavigation?: React.ReactNode;
  overlay?: boolean;
  position?: DrawerPosition; // default 'end'
  size?: DrawerSize; // default 'small'
  backdrop?: boolean; // default true
}

export type DrawerComponent = (props: DrawerProps) => JSX.Element | null;
