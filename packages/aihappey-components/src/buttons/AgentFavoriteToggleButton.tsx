import { useTranslation } from "aihappey-i18n";
import type React from "react";

import { useTheme } from "../theme/ThemeContext";

type AgentFavoriteToggleButtonBaseProps = Omit<React.ComponentProps<"button">, "onClick" | "title"> & {
  variant?: string;
  shape?: string;
  size?: string;
  iconPosition?: "left" | "right";
};

export type AgentFavoriteToggleButtonProps = AgentFavoriteToggleButtonBaseProps & {
  agentName?: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
};

export const AgentFavoriteToggleButton = ({
  agentName,
  isFavorite,
  onToggleFavorite,
  variant = "subtle",
  size = "small",
  ...buttonProps
}: AgentFavoriteToggleButtonProps) => {
  const { Button } = useTheme();
  const { t } = useTranslation();
  const title = t(isFavorite ? "unfavorite_agent" : "favorite_agent", {
    agent: agentName?.trim() || t("agent"),
  });

  return (
    <Button
      {...buttonProps}
      variant={variant}
      size={size}
      icon={isFavorite ? "starFilled" : "star"}
      title={title}
      onClick={onToggleFavorite}
    />
  );
};
