import type * as React from "react";
import type { ComponentType } from "react";

import type { UserMenuLabels } from "../i18n";

export type UserMenuProps = {
  email?: string;
  onCustomize?: () => void;
  onSettings: () => void;
  onLogout: () => void;

  /**
   * Optional API keys menu item.
   *
   * Typically hidden in Entra/Azure authenticated mode.
   */
  showApiKeysItem?: boolean;
  onApiKeys?: () => void;

  /**
   * Optional provider toggles for the user menu.
   *
   * NOTE: Today the app store persists enabled providers as **display names**
   * (e.g. "OpenAI", "Anthropic"), not provider ids.
   */
  providers?: string[];
  enabledProviders?: string[];
  onToggleProvider?: (provider: string) => void;

  /** When true, provider toggles are disabled (e.g. while models are still loading). */
  providersDisabled?: boolean;
  /** Providers (by display name) that should be disabled (e.g. because they returned 0 models). */
  disabledProviders?: string[];
  className?: string;
  labels?: UserMenuLabels;
  style?: React.CSSProperties;
};

export type UserMenuComponent = ComponentType<UserMenuProps>;
