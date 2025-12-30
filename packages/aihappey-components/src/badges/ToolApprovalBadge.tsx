import { useTheme } from "../theme/ThemeContext";

interface ToolApprovalBadgeProps {
  state: string
  approval?: any
  translations?: any
}

export const ToolApprovalBadge: React.FC<ToolApprovalBadgeProps> = ({
  state,
  approval,
  translations
}) => {
  const { Badge } = useTheme();

  return <>
    {state === 'approval-responded' &&
      approval?.approved && approval?.reason === 'YOLO'
      && <Badge icon="warning" bg="danger">{translations?.yolo ?? 'YOLO'}</Badge>}
  </>;
};
