import type * as React from "react";
import type { JSX } from "react";

import type { IconToken } from "./IconToken";

/**
 * Breadcrumb navigation primitive
 */
export type BreadcrumbProps = {
  items: {
    key: string;
    icon?: IconToken;
    label: React.ReactNode;
    onClick?: () => void;
  }[];
  separator?: React.ReactNode;
  className?: string;
  size?: "small" | "medium" | "large" | undefined;
  style?: React.CSSProperties;
};

export type BreadcrumbComponent = (props: BreadcrumbProps) => JSX.Element;
