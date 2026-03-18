import { useMemo } from "react";
import type { MenuItemProps } from "aihappey-types";
import { useTranslation } from "aihappey-i18n";
import { LimitedTextField } from "../fields/LimitedTextField";
import { useTheme } from "../theme/ThemeContext";

export type SkillCardItem = {
  id: string;
  name: string;
  description: string;
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
};

export const SkillCard = ({ skill, onDelete, onDownload }: SkillCardProps) => {
  const { Card, Menu, Button, Badge } = useTheme();
  const { t } = useTranslation();

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

  const actions = onDownload ? (
    <Button icon="download" size="small" variant="transparent" onClick={onDownload}>
    </Button>
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
    </div>
  );

  return (
    <Card
      title={skill.name}
      size="small"
      description={description}
      actions={actions}
      headerActions={onDelete ? <Menu items={menuItems} /> : undefined}
    >
      <LimitedTextField text={skill.description} />
    </Card>
  );
};
