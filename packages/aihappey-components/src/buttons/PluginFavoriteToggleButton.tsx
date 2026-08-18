import type React from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";

type PluginFavoriteToggleButtonBaseProps = Omit<React.ComponentProps<"button">, "onClick" | "title"> & {
  variant?: string;
  size?: "small" | "medium" | "large";
};

export type PluginFavoriteToggleButtonProps = PluginFavoriteToggleButtonBaseProps & {
  pluginName?: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
};

export const PluginFavoriteToggleButton = ({
  pluginName,
  isFavorite,
  onToggleFavorite,
  variant = "subtle",
  size = "medium",
  ...buttonProps
}: PluginFavoriteToggleButtonProps) => {
  const { Button } = useTheme();
  const { t } = useTranslation();
  const title = t(isFavorite ? "unfavorite_plugin" : "favorite_plugin", {
    plugin: pluginName?.trim() || t("pluginsPage.title"),
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
