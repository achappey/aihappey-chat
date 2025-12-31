import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";

interface ToolApprovalBadgeProps {
  state: string
  toolName: string
  approval?: any
}

export const ToolApprovalBadge: React.FC<ToolApprovalBadgeProps> = ({
  state,
  approval,
  toolName,
}) => {
  const { Badge } = useTheme();
  const { t } = useTranslation();

  return <>
    {state === 'approval-responded' &&
      approval?.approved && approval?.reason === 'YOLO'
      && <Badge icon="warning" bg="danger">{approval?.reason}</Badge>}
    {state === 'approval-responded' &&
      approval?.approved && approval?.reason === toolName
      && <Badge bg="warning">{t('tool')}</Badge>}
  </>;
};
