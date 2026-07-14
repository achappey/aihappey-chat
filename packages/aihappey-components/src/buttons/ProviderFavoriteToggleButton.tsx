import { useTranslation } from "aihappey-i18n";
import type React from "react";

import { useTheme } from "../theme/ThemeContext";

type ProviderFavoriteToggleButtonBaseProps = Omit<React.ComponentProps<"button">, "onClick" | "title"> & {
  variant?: string;
  shape?: string;
  size?: string;
  iconPosition?: "left" | "right";
};

export type ProviderFavoriteToggleButtonProps = ProviderFavoriteToggleButtonBaseProps & {
  providerName?: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
};

export const ProviderFavoriteToggleButton = ({
  providerName,
  isFavorite,
  onToggleFavorite,
  variant = "subtle",
  size = "small",
  ...buttonProps
}: ProviderFavoriteToggleButtonProps) => {
  const { Button } = useTheme();
  const { t } = useTranslation();
  const title = t(isFavorite ? "unfavorite_provider" : "favorite_provider", {
    provider: providerName?.trim() || t("providers"),
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

