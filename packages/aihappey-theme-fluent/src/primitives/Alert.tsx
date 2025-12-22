import * as React from "react";
import {
  Button,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  MessageBarTitle,
} from "@fluentui/react-components";
import { DismissRegular } from "@fluentui/react-icons";

export const Alert = ({
  variant,
  className,
  onDismiss,
  title,
  children,
}: {
  variant: string;
  title?: string;
  className?: string;
  onDismiss?: () => void;
  children: React.ReactNode;
}): JSX.Element => (
  <MessageBar
    intent={
      variant === "danger" || variant === "error"
        ? "error"
        : variant === "warning"
        ? "warning"
        : "info"
    }
    className={className}
  >
    <MessageBarBody>
      {title && <MessageBarTitle>{title}</MessageBarTitle>}
      {children}
    </MessageBarBody>
    {onDismiss && (
      <MessageBarActions
        containerAction={
          <Button
            onClick={onDismiss}
            aria-label="dismiss"
            appearance="transparent"
            icon={<DismissRegular />}
          />
        }
      />
    )}
  </MessageBar>
);
