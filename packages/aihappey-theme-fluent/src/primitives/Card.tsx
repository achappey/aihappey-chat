import * as React from "react";
import type { JSX } from "react";
import {
  Card as FluentCard,
  CardHeader,
  CardFooter,
  CardPreview,
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
  image?: React.ReactElement
  children?: React.ReactNode;
  style?: React.CSSProperties;
  actions?: JSX.Element;
  headerActions?: JSX.Element;
}): JSX.Element => {
  const { isDarkMode } = useDarkMode();
  const previewStyle =
    size == "small"
      ? { paddingLeft: 8, paddingRight: 8 }
      : { paddingLeft: 12, paddingRight: 12 };

  const hasChildren =
    Array.isArray(children) ? children.length > 0 : !!children;

  return (
    <FluentCard
      size={size}
      className={className}
      style={{
        backgroundColor: !style?.backgroundColor ?
          isDarkMode
            ? tokens.colorNeutralBackground2
            : tokens.colorNeutralBackground3 : style?.backgroundColor,
      }}
    >
      <CardHeader
        header={title}
        image={image}
        description={description}
        action={headerActions}
      />
      <CardPreview style={previewStyle}>{hasChildren ? children : text}</CardPreview>
      {actions && <CardFooter>{actions}</CardFooter>}
    </FluentCard>
  );
};
