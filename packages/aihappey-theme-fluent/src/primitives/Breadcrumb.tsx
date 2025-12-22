import {
  Breadcrumb as FBreadcrumb,
  BreadcrumbItem,
  BreadcrumbDivider,
  BreadcrumbButton,
} from "@fluentui/react-components";
import { IconToken } from "aihappey-types";
import type { JSX } from "react";
import { iconMap } from "./Button";

type BreadcrumbItemType = {
  key: string;
  label: React.ReactNode;
  icon?: IconToken;
  onClick?: () => void;
};

type BreadcrumbProps = {
  items: BreadcrumbItemType[];
  separator?: React.ReactNode;
  className?: string;
  size?: "small" | "medium" | "large" | undefined;
  style?: React.CSSProperties;
};

export const Breadcrumb = ({
  items,
  separator,
  className,
  size,
  style,
}: BreadcrumbProps): JSX.Element => (
  <FBreadcrumb className={className} style={style} size={size}>
    {items.map((item, idx) => {
      const IconElement = item.icon
        ? iconMap[item.icon as IconToken]
        : undefined;

      return (
        <BreadcrumbItem key={item.key}>
          {item.onClick ? (
            <BreadcrumbButton
              icon={IconElement && <IconElement />}
              onClick={item.onClick}
            >
              {item.label}
            </BreadcrumbButton>
          ) : (
            item.label
          )}
          {idx < items.length - 1 &&
            (separator ? (
              <span style={{ margin: "0 0.5em" }}>{separator}</span>
            ) : (
              <BreadcrumbDivider />
            ))}
        </BreadcrumbItem>
      );
    })}
  </FBreadcrumb>
);
