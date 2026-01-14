import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";
import { BrrrBadge } from "./BrrrBadge";

interface ToolInvocationStateBadgeProps {
  state: string
  toolName: string
  toolTitle?: string
  isError?: boolean
  approval?: {
    id: string;
    approved?: boolean | undefined;
    reason?: string | undefined;
  } | undefined
}

export const ToolInvocationStateBadge: React.FC<ToolInvocationStateBadgeProps> = ({
  state,
  toolTitle,
  toolName,
  isError,
  approval
}) => {
  const { Badge } = useTheme();
  const { t } = useTranslation();

  return <>
    {state === 'output-available' && (
      isError ? (
        <Badge bg="severe">{t("error")}</Badge>
      ) : (
        <Badge bg="success">{t(state)}</Badge>
      )
    )}
    
    {state === 'approval-responded' &&
      isError ? (
      <Badge bg="severe">{t("error")}</Badge>) :
      approval?.approved && (approval?.reason === 'YOLO' || approval?.reason === 'BRRR')
        ? <BrrrBadge reason={approval?.reason} /> :
        approval?.approved && approval?.reason === toolName
          ? <Badge appearance={"tint"}
            bg="warning">{toolTitle ?? toolName}
          </Badge> : approval?.approved
            ? <Badge bg="success">{t("output-approved")}</Badge> :
            <Badge bg="warning">{t("output-denied")}</Badge>
    }

    {state === 'output-error' && <Badge bg="severe">{t("error")}</Badge>}
    {(state === 'input-streaming' || state === 'input-available')
      && <Badge bg="subtle">{t(state)}</Badge>}
  </>;
};
