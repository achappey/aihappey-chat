import { useTranslation } from "aihappey-i18n";
import type React from "react";

import { useTheme } from "../theme/ThemeContext";

type ModelFavoriteToggleButtonBaseProps = Omit<React.ComponentProps<"button">, "onClick" | "title"> & {
  variant?: string;
  shape?: string;
  size?: string;
  iconPosition?: "left" | "right";
};

export type ModelFavoriteToggleButtonProps = ModelFavoriteToggleButtonBaseProps & {
  modelName?: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
};

export const ModelFavoriteToggleButton = ({
  modelName,
  isFavorite,
  onToggleFavorite,
  variant = "subtle",
  size = "small",
  ...buttonProps
}: ModelFavoriteToggleButtonProps) => {
  const { Button } = useTheme();
  const { t } = useTranslation();
  const title = t(isFavorite ? "unfavorite_model" : "favorite_model", {
    model: modelName?.trim() || t("model"),
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
