import * as React from "react";
import { Badge as FluentBadge } from "@fluentui/react-components";
import { iconMap } from "./Button";
import { IconToken } from "aihappey-types";

export const Badge = ({
  bg,
  text,
  appearance,
  size,
  icon,
  children,
}: {
  bg?: string;
  icon?: IconToken | undefined
  text?: string;
  appearance?: any
  size?: any
  children: React.ReactNode;
}): JSX.Element => {
  const IconElem = icon ? iconMap[icon] : undefined;

  return <FluentBadge size={size}
    icon={IconElem ? <IconElem /> : undefined}
    appearance={appearance}
    color={(bg as any) == "primary" ? "brand" : (bg as any)}>
    {text ?? children}
  </FluentBadge>
};
