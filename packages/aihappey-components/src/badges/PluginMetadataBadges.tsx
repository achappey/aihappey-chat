import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";

export type PluginMetadataBadgesProps = {
  version?: string;
  skillCount?: number;
  mcpServerCount?: number;
};

export const PluginMetadataBadges = ({
  version,
  skillCount = 0,
  mcpServerCount = 0,
}: PluginMetadataBadgesProps) => {
  const { Badge } = useTheme();
  const { t } = useTranslation();

  return (
    <>
      {version ? <Badge size="small" bg="subtle">{version}</Badge> : null}
      {skillCount > 0 ? (
        <Badge size="small" appearance="neutral" icon="skills">{t("skills")}</Badge>
      ) : null}
      {mcpServerCount > 0 ? (
        <Badge size="small" appearance="neutral" icon="mcpServer">MCP</Badge>
      ) : null}
    </>
  );
};
