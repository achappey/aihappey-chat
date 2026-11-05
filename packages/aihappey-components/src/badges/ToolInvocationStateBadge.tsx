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
    signature?: string;
    isAutomatic?: boolean;
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
      {approval?.isAutomatic === true && typeof approval.approved === "boolean" && (
        <span aria-label={t("automatic")} title={t("automatic")}>
          <Badge size={size} bg="subtle">{t("automatic")}</Badge>
        </span>
      )}
      {typeof approval?.signature === "string" && approval.signature.trim().length > 0 && (
        <span tabIndex={0} aria-label={t("toolApprovalSignatureAttached")}
          aria-description={approval.signature}
          title={`${t("toolApprovalSignatureAttached")}\n${approval.signature}`}>
          <Badge size={size} bg="subtle">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true">
              <rect x="3" y="7" width="10" height="7" rx="1.5" />
              <path d="M5 7V5a3 3 0 0 1 6 0v2" />
            </svg>
          </Badge>
        </span>
      )}
    </>
  );
};
