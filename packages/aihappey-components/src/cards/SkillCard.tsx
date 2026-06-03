import { useMemo } from "react";
import type { MenuItemProps, Provider } from "aihappey-types";
import { useTranslation } from "aihappey-i18n";
import { useDarkMode } from "usehooks-ts";
import { LimitedTextField } from "../fields/LimitedTextField";
import { useTheme } from "../theme/ThemeContext";
import { SkillFavoriteToggleButton } from "../buttons/SkillFavoriteToggleButton";

export type SkillCardItem = {
  id: string;
  name: string;
  description: string;
  icons?: Provider["icons"];
  fileCount?: number;
  origin?: "local" | "remote";
  downloadState?: "remote" | "downloading" | "downloaded" | "error";
  version?: string;
  latestVersion?: string;
  isDownloaded?: boolean;
};

export type SkillCardProps = {
  skill: SkillCardItem;
  onDelete?: () => void;
  onDownload?: () => void;
  onView?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
};

export const SkillCard = ({ skill, onDelete, onDownload, onView, isFavorite = false, onToggleFavorite }: SkillCardProps) => {
  const { Card, Menu, Button, Badge, Image } = useTheme();
  const { t } = useTranslation();
  const isDarkMode = useDarkMode();

  const menuItems: MenuItemProps[] = useMemo(
    () =>
      onDelete
        ? [
          {
            key: "delete",
            label: t("delete"),
            onClick: onDelete,
          },
        ]
        : [],
    [onDelete, t]
  );

  const actions = (
    <>
      {onView ? (
        <Button icon="eye" size="small" variant="transparent" onClick={onView}></Button>
      ) : null}
      {onDownload ? (
        <Button icon="download" size="small" variant="transparent" onClick={onDownload}></Button>
      ) : null}
      {onToggleFavorite ? (
        <SkillFavoriteToggleButton
          variant="transparent"
          skillName={skill.name}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
        />
      ) : null}
    </>
  );

  const iconImage =
    skill.icons?.find((icon) => icon.theme === (isDarkMode ? "dark" : "light"))?.src ??
    skill.icons?.[0]?.src;

  const imageItem = iconImage ? (
    <Image height={32} title={skill.name} shape="square" src={iconImage} />
  ) : undefined;

  const description = (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {typeof skill.fileCount === "number" && skill.fileCount > 0 ? (
        <Badge size="small" bg="informative">
          {t("skillsPage.fileCountBadge", { count: skill.fileCount })}
        </Badge>
      ) : null}
      {skill.version ? (
        <Badge size="small" bg="subtle">
          {(t("skillsPage.versionBadge", { version: skill.version }) ?? `v${skill.version}`)}
        </Badge>
      ) : null}
      {skill.downloadState === "error" ? (
        <Badge size="small" bg="danger">
          {t("error") ?? "Error"}
        </Badge>
      ) : null}
    </div>
  );

  return (
    <Card
      title={skill.name}
      size="small"
      image={imageItem}
      description={description}
      actions={onToggleFavorite || onView || onDownload ? actions : undefined}
      headerActions={onDelete ? <Menu items={menuItems} /> : undefined}
    >
      <LimitedTextField text={skill.description} />
    </Card>
  );
};
