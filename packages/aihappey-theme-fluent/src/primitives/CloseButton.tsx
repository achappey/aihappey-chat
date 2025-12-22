import * as React from "react";
import { Button as FluentButton } from "@fluentui/react-components";
import { Dismiss24Regular } from "@fluentui/react-icons";

export const CloseButton = ({
  onClick,
  className,
  style,
  "aria-label": ariaLabel,
}: {
  onClick: (e: any) => void;
  className?: string;
  style?: React.CSSProperties;
  "aria-label"?: string;
}): JSX.Element => (
  <FluentButton
    appearance="subtle"
    shape="circular"
    icon={<Dismiss24Regular />}
    aria-label={ariaLabel || "Close"}
    onClick={onClick}
    className={className}
    style={style}
  />
);
