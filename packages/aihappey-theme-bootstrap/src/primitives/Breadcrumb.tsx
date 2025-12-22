import { Breadcrumb as RBBreadcrumb } from "react-bootstrap";
import type { JSX } from "react";

type BreadcrumbItem = {
  key: string;
  label: React.ReactNode;
  href?: string;
  onClick?: () => void;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export const Breadcrumb = ({
  items,
  separator,
  className,
  style,
}: BreadcrumbProps): JSX.Element => (
  <RBBreadcrumb className={className} style={style}>
    {items.map((item, idx) => (
      <RBBreadcrumb.Item
        key={item.key}
        href={item.href}
        active={!item.href}
        onClick={item.onClick}
      >
        {item.label}
      </RBBreadcrumb.Item>
    ))}
    {/* Custom separator is not natively supported in react-bootstrap Breadcrumb,
        but can be styled via CSS if needed. */}
  </RBBreadcrumb>
);