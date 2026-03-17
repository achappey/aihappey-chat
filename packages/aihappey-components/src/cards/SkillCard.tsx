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
  const description = <>{typeof skill.fileCount === "number" ? (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Badge size="small" bg="informative">
        {t("skillsPage.fileCountBadge", { count: skill.fileCount })}
      </Badge>
    </div>
  ) : null}</>

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
