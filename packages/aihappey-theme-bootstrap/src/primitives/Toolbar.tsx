import * as React from "react";
import { Button } from "react-bootstrap";
import ButtonToolbar from "react-bootstrap/ButtonToolbar";

export const Toolbar: React.FC<{
  ariaLabel?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ ariaLabel, className, children, ...rest }) => (
  <ButtonToolbar aria-label={ariaLabel} className={className} {...rest}>
    {children}
  </ButtonToolbar>
);

export const ToolbarButton: React.FC<{
  ariaLabel?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ ariaLabel, className, children, ...rest }) => (
  <Button aria-label={ariaLabel} className={className} {...rest}>
    {children}
  </Button>
);

export const ToolbarDivider: React.FC<{
  ariaLabel?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ ariaLabel, className, children, ...rest }) => <div></div>;
