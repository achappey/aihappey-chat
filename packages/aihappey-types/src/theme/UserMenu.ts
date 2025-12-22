import type * as React from "react";
import type { ComponentType } from "react";

import type { UserMenuLabels } from "../i18n";

export type UserMenuProps = {
  email?: string;
  onCustomize?: () => void;
  onSettings: () => void;
  onLogout: () => void;
  className?: string;
  labels?: UserMenuLabels;
  style?: React.CSSProperties;
};

export type UserMenuComponent = ComponentType<UserMenuProps>;
