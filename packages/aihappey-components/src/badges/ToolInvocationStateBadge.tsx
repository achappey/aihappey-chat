import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";
import { BrrrBadge } from "./BrrrBadge";

interface ToolInvocationStateBadgeProps {
  state: string;
  toolName: string;
  toolTitle?: string;
  isError?: boolean;
  approval?:
  | {
    id: string;
    approved?: boolean | undefined;
    reason?: string | undefined;
  }
  | undefined;
}

export const ToolInvocationStateBadge: React.FC<ToolInvocationStateBadgeProps> = ({
  state,
  toolTitle,
  toolName,
  isError,
  approval,
}) => {
  const { Badge } = useTheme();
  const { t } = useTranslation();

  const size = "small";

  return (
    <>
      {state === "output-available" && (
        isError ? (
          <Badge size={size} bg="severe">{t("error")}</Badge>
        ) : (
          <Badge size={size} bg="success">{t(state)}</Badge>
        )
      )}

      {
        (state === "approval-responded" && isError) ? (
          <Badge size={size} bg="severe">{t("error")}</Badge>
        ) : approval?.approved == true &&
          (approval?.reason === "YOLO" || approval?.reason === "BRRR") ? (
          <BrrrBadge size={size} reason={approval?.reason} />
        ) : approval?.approved == true && approval?.reason === toolName ? (
          <Badge size={size} appearance={"tint"} bg="warning">
            {t("tool")}
          </Badge>
        ) : approval?.approved == true ? (
          <Badge size={size} bg="success">{t("output-approved")}</Badge>
        ) : approval?.approved == false ? (
          <Badge size={size} bg="warning">{t("output-denied")}</Badge>
        ) : (
          <Badge size={size} bg="important">{t(state)}</Badge>
        )
      }

      {state === "output-error" && <Badge size={size} bg="severe">{t("error")}</Badge>}

      {(state === "input-streaming" || state === "input-available") && (
        <Badge size={size} bg="subtle">{t(state)}</Badge>
      )}
    </>
  );
};
