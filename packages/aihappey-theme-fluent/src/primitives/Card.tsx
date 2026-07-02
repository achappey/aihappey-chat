import * as React from "react";
import type { JSX } from "react";
import {
  Card as FluentCard,
  CardHeader,
  CardFooter,
  tokens,
} from "@fluentui/react-components";
import { useDarkMode } from "usehooks-ts";

export const Card = ({
  title,
  text,
  size,
  children,
  description,
  className,
  selected,
  disabled,
  image,
  style,
  actions,
  headerActions,
}: {
  title: any;
  text?: string;
  className?: string;
  description?: string;
  size?: any;
  selected?: boolean
  disabled?: boolean
  image?: React.ReactElement
  children?: React.ReactNode;
  style?: React.CSSProperties;
  actions?: JSX.Element;
  headerActions?: JSX.Element;
}): JSX.Element => {
  const { isDarkMode } = useDarkMode();
  const backgroundColor = style?.backgroundColor ?? (isDarkMode
    ? tokens.colorNeutralBackground2
    : tokens.colorNeutralBackground3);
  const foregroundColor = style?.color ?? tokens.colorNeutralForeground1;
  const contentStyle: React.CSSProperties =
    { color: foregroundColor };

  const hasChildren =
    Array.isArray(children) ? children.length > 0 : !!children;

  return (
    <FluentCard
      size={size}
      selected={selected}
      disabled={disabled}
      className={className}
      style={{
        ...style,
        backgroundColor,
        color: foregroundColor,
      }}
    >
      <CardHeader
        header={title}
        image={image}
        description={description}
        action={headerActions}
      />
      <div style={contentStyle}>{hasChildren ? children : text}</div>
      {actions && <CardFooter>{actions}</CardFooter>}
    </FluentCard>
  );
};
