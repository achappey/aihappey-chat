import React from "react";
import { useTheme } from "aihappey-components";

import { useTranslation } from "aihappey-i18n";

interface UserMenuButtonProps {
  email?: string;
  onSettings: () => void;
  onLogout: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const UserMenuButton: React.FC<UserMenuButtonProps> = ({
  email,
  onSettings,
  onLogout,
  className,
  style,
}) => {
  const { UserMenu } = useTheme();
  const { t } = useTranslation();
  return (
    <UserMenu
      email={email}
      onSettings={onSettings}
      onLogout={onLogout}
      labels={{
        settings: t("userMenu.settings"),
        logout: t("userMenu.logout"),
      }}
      className={className}
      style={style}
    />
  );
};
