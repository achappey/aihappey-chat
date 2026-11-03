import React from "react";
import Dropdown from "react-bootstrap/Dropdown";
import {
  PersonCircle,
  Gear,
  BoxArrowRight,
  Sliders,
  Key,
} from "react-bootstrap-icons";

import type { UserMenuProps } from "aihappey-types/src/theme/UserMenu";

export const UserMenu: React.FC<UserMenuProps> = ({
  email,
  onCustomize,
  onSettings,
  onLogout,
  showApiKeysItem,
  onApiKeys,
  showChatEndpointsItem,
  chatEndpointGroups = [],
  selectedChatEndpoint,
  chatEndpointsDisabled,
  onSelectChatEndpoint,
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
        {showChatEndpointsItem ? (
          chatEndpointGroups.map(group => (
            <Dropdown key={group.value} drop="start">
              <Dropdown.Toggle className="dropdown-item" variant="link"
                disabled={!!chatEndpointsDisabled || !!group.disabled || !group.options.length}>
                {group.label}{group.options.some(option => option.value === selectedChatEndpoint)
                  ? ` (${group.options.find(option => option.value === selectedChatEndpoint)?.label})` : ""}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {group.options.map(option => (
                  <Dropdown.Item key={option.value} active={option.value === selectedChatEndpoint}
                    disabled={!!option.disabled} onClick={() => onSelectChatEndpoint?.(option.value)}>
                    {option.label}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          ))
        ) : null}
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
