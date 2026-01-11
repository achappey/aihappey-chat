import React from "react";
import Dropdown from "react-bootstrap/Dropdown";
import {
  PersonCircle,
  Gear,
  BoxArrowRight,
  Sliders,
  Key,
} from "react-bootstrap-icons";

import { UserMenuLabels } from "aihappey-types/src/i18n";

export interface UserMenuProps {
  email?: string;
  onCustomize?: () => void;
  onSettings: () => void;
  onLogout: () => void;
  showApiKeysItem?: boolean;
  onApiKeys?: () => void;

  /**
   * Optional provider toggles (implemented in Fluent theme). Accepted here so the
   * theme contract stays compatible across themes.
   */
  providers?: string[];
  providerGroups?: Record<string, string[]>;
  enabledProviders?: string[];
  onToggleProvider?: (provider: string) => void;
  providersDisabled?: boolean;
  disabledProviders?: string[];

  className?: string;
  style?: React.CSSProperties;
  labels?: UserMenuLabels;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  email,
  onCustomize,
  onSettings,
  onLogout,
  showApiKeysItem,
  onApiKeys,
  className,
  style,
  labels = {},
}) => {
  // Use first letter of email or fallback to icon
  const trigger = (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: "#e9ecef",
        color: "#343a40",
        fontWeight: 600,
        fontSize: 18,
        userSelect: "none",
      }}
    >
      {email ? email[0].toUpperCase() : <PersonCircle size={22} />}
    </span>
  );

  return (
    <Dropdown align="end" className={className} style={style}>
      <Dropdown.Toggle
        as="span"
        style={{
          border: "none",
          background: "none",
          cursor: "pointer",
          padding: 0,
        }}
        id="user-menu-toggle"
      >
        {trigger}
      </Dropdown.Toggle>
      <Dropdown.Menu>
        {email && (
          <>
            <Dropdown.Header>{email}</Dropdown.Header>
            <Dropdown.Divider />
          </>
        )}
        {onCustomize && (
          <Dropdown.Item onClick={onCustomize}>
            <Sliders className="me-2" /> {labels.customize ?? "Customize"}
          </Dropdown.Item>
        )}

        {!!showApiKeysItem && !!onApiKeys && (
          <Dropdown.Item onClick={onApiKeys}>
            <Key className="me-2" /> {labels.apiKeys ?? "API keys"}
          </Dropdown.Item>
        )}
        <Dropdown.Item onClick={onSettings}>
          <Gear className="me-2" /> {labels.settings ?? "Settings"}
        </Dropdown.Item>
        <Dropdown.Divider />
        <Dropdown.Item onClick={onLogout}>
          <BoxArrowRight className="me-2" /> {labels.logout ?? "Log out"}
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};
