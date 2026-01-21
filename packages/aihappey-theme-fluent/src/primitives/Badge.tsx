import * as React from "react";
import { Badge as FluentBadge, tokens, Tooltip } from "@fluentui/react-components";
import { iconMap } from "./Button";
import { IconToken } from "aihappey-types";

export const Badge = ({
  bg,
  text,
  title,
  appearance,
  size,
  icon,
  children,
}: {
  bg?: string;
  icon?: IconToken | undefined
  text?: string;
  title?: string;
  appearance?: any
  size?: any
  children: React.ReactNode;
}): JSX.Element => {
  const IconElem = icon ? iconMap[icon] : undefined;

  const badge = <FluentBadge size={size}
    icon={IconElem ? <IconElem /> : undefined}
    appearance={appearance}
    color={(bg as any) == "primary" ? "brand" : (bg as any)}>
    {text ?? children}
  </FluentBadge>

  return title ?
    <Tooltip content={title}
      relationship={"label"}>
      {badge}
    </Tooltip>
    : badge;
};
