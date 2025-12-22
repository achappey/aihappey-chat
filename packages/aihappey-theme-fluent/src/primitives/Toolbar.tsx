import * as React from "react";
import {
  Toolbar as FToolbar,
  ToolbarButton as FButton,
  ToolbarDivider as FDivider,
  ToolbarProps as FToolbarProps,
  ToolbarGroup as FToolbarGroup,
  ToolbarButtonProps as FBtnProps,
} from "@fluentui/react-components";
import { iconMap } from "./Button";

export const Toolbar: React.FC<
  { children: React.ReactNode; ariaLabel?: string } & FToolbarProps
> = ({ children, ariaLabel, ...rest }) => (
  <FToolbar aria-label={ariaLabel} {...rest}>
    {children}
  </FToolbar>
);
// Optional: convenience wrappers for direct imports
export const ToolbarButton: React.FC<
  { icon?: keyof typeof iconMap } & Omit<FBtnProps, "icon">
> = ({ icon, ...rest }) => {
  const IconElem = icon ? iconMap[icon] : undefined;
  return (
    <FButton
      icon={IconElem ? <IconElem /> : undefined}
      {...(rest as any)}
    />
  );
};

export const ToolbarDivider = FDivider;
