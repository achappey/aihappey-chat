import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";

interface ToolInvocationStateBadgeProps {
  state: string
  isError?: boolean
  approved?: boolean
}

export const ToolInvocationStateBadge: React.FC<ToolInvocationStateBadgeProps> = ({
  state,
  isError,
  approved
}) => {
  const { Badge } = useTheme();
  const { t } = useTranslation();

  return <>
    {state === 'output-available' && (
      isError ? (
        <Badge bg="severe">{t("error")}</Badge>
      ) : (
        <Badge bg="success">{t("success")}</Badge>
      )
    )}
    {state === 'approval-responded' && (
      isError ? (
        <Badge bg="severe">{t("error")}</Badge>
      ) : approved ? (
        <Badge bg="success">{t("approved")}</Badge>
      ) : (
        <Badge bg="warning">{t("denied")}</Badge>
      )
    )}
    {state === 'output-error' && <Badge bg="severe">{t("error")}</Badge>}
    {state === 'input-streaming' && <Badge bg="subtle">{t("streaming")}</Badge>}
    {state === 'input-available' && <Badge bg="subtle">{t("running")}</Badge>}
  </>;
};
