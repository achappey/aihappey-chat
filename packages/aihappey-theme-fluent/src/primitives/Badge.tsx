import * as React from "react";
import { Badge as FluentBadge, tokens, Tooltip } from "@fluentui/react-components";
import { iconMap } from "./Button";
import { IconToken } from "aihappey-types";
import { JSX } from "react";

export const Badge = ({
  bg,
  text,
  title,
  appearance,
  size,
  icon,
  children,
  style,
}: {
  bg?: string;
  icon?: IconToken | undefined
  text?: string;
  title?: string;
  appearance?: any
  size?: any
  style?: React.CSSProperties
  children: React.ReactNode;
}): JSX.Element => {
  const IconElem = icon ? iconMap[icon] : undefined;
  const isNeutralBadge = appearance === "neutral";
  const fluentAppearance = isNeutralBadge ? "transparent" : appearance;
  const fluentColor = isNeutralBadge ? "neutral" : (bg as any) === "primary" ? "brand" : (bg as any);
  const fluentStyle = isNeutralBadge
    ? { color: tokens.colorNeutralForeground1, ...style }
    : style;

  const badge = <FluentBadge size={size}
    icon={IconElem ? <IconElem /> : undefined}
    appearance={fluentAppearance}
    style={fluentStyle}
    color={fluentColor}>
    {text ?? children}
  </FluentBadge>

  return title ?
    <Tooltip content={title}
      relationship={"label"}>
      {badge}
    </Tooltip>
    : badge;
};
