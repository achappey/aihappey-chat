import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";

export type ElicitationAction = "accept" | "decline" | "cancel";

type ElicitationActionButtonsProps = {
  isValid?: boolean;
  onAction: (action: ElicitationAction) => void;
};

export const ElicitationActionButtons = ({
  isValid,
  onAction,
}: ElicitationActionButtonsProps) => {
  const { Button } = useTheme();
  const { t } = useTranslation();

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <Button
        variant="primary"
        disabled={!isValid}
        onClick={() => onAction("accept")}
      >
        {t("mcp.accept")}
      </Button>

      <Button
        variant="informative"
        onClick={() => onAction("decline")}
      >
        {t("mcp.decline")}
      </Button>

      <Button
        variant="subtle"
        onClick={() => onAction("cancel")}
      >
        {t("mcp.cancel")}
      </Button>
    </div>
  );
};
