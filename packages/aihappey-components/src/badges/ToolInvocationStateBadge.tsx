import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";
import { BrrrBadge } from "./BrrrBadge";

interface ToolInvocationStateBadgeProps {
  state: string;
  toolName: string;
  toolTitle?: string;
  isError?: boolean;
  approval?: {
    id: string;
    approved?: boolean;
    reason?: string;
  };
}

export const ToolInvocationStateBadge: React.FC<ToolInvocationStateBadgeProps> = ({
  state,
  toolName,
  isError,
  approval,
}) => {
  const { Badge } = useTheme();
  const { t } = useTranslation();

  const size = "small";

  //
  // ---------------------------
  // PRIMARY STATUS BADGE
  // ---------------------------
  //
  let statusBadge: React.ReactNode = null;

  if (isError || state === "output-error") {
    statusBadge = <Badge size={size} bg="severe">{t("error")}</Badge>;
  }
  else if (state === "output-available") {
    statusBadge = <Badge size={size} bg="success">{t(state)}</Badge>;
  }
  else if (state === "input-streaming" || state === "input-available") {
    statusBadge = <Badge size={size} bg="subtle">{t(state)}</Badge>;
  }
  else
    if (
      state !== "approval-responded"
    ) {
      statusBadge = <Badge size={size} bg="important">{t(state)}</Badge>;
    }

  //
  // ---------------------------
  // OPTIONAL APPROVAL BADGE
  // ---------------------------
  //
  let approvalBadge: React.ReactNode = null;

  if (approval?.approved === true) {

    if (approval.reason === "YOLO" || approval.reason === "BRRR") {
      approvalBadge = (
        <BrrrBadge size={size} reason={approval.reason} />
      );
    }
    else if (approval.reason === toolName) {
      // Ayuto/tool-approved
      approvalBadge = (
        <Badge size={size} appearance="tint" bg="warning">
          {t("tool")}
        </Badge>
      );
    }
    else {
      approvalBadge = (
        <Badge size={size} bg="success">
          {t("output-approved")}
        </Badge>
      );
    }
  }
  else if (approval?.approved === false) {
    approvalBadge = (
      <Badge size={size} bg="warning">
        {t("output-denied")}
      </Badge>
    );
  }

  return (
    <>
      {statusBadge}
      {approvalBadge}
    </>
  );
};
