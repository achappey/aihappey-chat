import type * as React from "react";
import type { JSX } from "react";

export type TabsProps = {
  style?: React.CSSProperties;
  activeKey: string;
  vertical?: boolean;
  size?: "small" | "medium" | "large";
  onSelect: (k: string) => void;
  className?: string;
  children: React.ReactNode;
};

export type TabsComponent = (props: TabsProps) => JSX.Element;
