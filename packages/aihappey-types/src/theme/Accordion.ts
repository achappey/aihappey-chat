import type * as React from "react";
import type { JSX } from "react";

export type AccordionVariant = "default" | "flush";

export type AccordionItem = {
  key: string;
  header: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
  className?: string;
};

export type AccordionProps = {
  items: AccordionItem[];
  openItems?: string[];
  defaultOpenItems?: string[];
  onToggle?: (openItems: string[]) => void;
  multiple?: boolean;
  collapsible?: boolean;
  variant?: AccordionVariant;
  className?: string;
  style?: React.CSSProperties;
};

export type AccordionComponent = (props: AccordionProps) => JSX.Element;
