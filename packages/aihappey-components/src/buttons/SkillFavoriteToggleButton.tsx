import { useTranslation } from "aihappey-i18n";
import type React from "react";

import { useTheme } from "../theme/ThemeContext";

type SkillFavoriteToggleButtonBaseProps = Omit<React.ComponentProps<"button">, "onClick" | "title"> & {
  variant?: string;
  shape?: string;
  size?: string;
  iconPosition?: "left" | "right";
};

export type SkillFavoriteToggleButtonProps = SkillFavoriteToggleButtonBaseProps & {
  skillName?: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
};

export const SkillFavoriteToggleButton = ({
  skillName,
  isFavorite,
  onToggleFavorite,
  variant = "subtle",
  size = "small",
  ...buttonProps
}: SkillFavoriteToggleButtonProps) => {
  const { Button } = useTheme();
  const { t } = useTranslation();
  const title = t(isFavorite ? "unfavorite_skill" : "favorite_skill", {
    skill: skillName?.trim() || t("skills"),
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
