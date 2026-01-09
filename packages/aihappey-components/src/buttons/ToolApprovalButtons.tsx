import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";
import { ViewButton } from "./ViewButton";

type ToolApprovalButtonsProps = {
  size?: "small" | "medium";
  toolName?: string;
  toolTitle?: string;
  canViewOutput?: boolean;
  onViewOutput?: () => void;
  onAllow: () => void;
  onDeny: () => void;
  onAllowThisTool: () => void;
  onAllowAllTools: () => void;
};

export const ToolApprovalButtons = ({
  size = "medium",
  toolName,
  toolTitle,
  canViewOutput,
  onViewOutput,
  onAllow,
  onDeny,
  onAllowThisTool,
  onAllowAllTools,
}: ToolApprovalButtonsProps) => {
  const { Button, SplitButton } = useTheme();
  const { t } = useTranslation();

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <ViewButton
        variant="subtle"
        size={size}
        disabled={!canViewOutput}
        onClick={onViewOutput}
      />

      <SplitButton
        size={size}
        label={t('automatic')}
        variant="secondary"
        onClick={onAllowThisTool}
        menuItems={[
          {
            key: "allow-this-tool",
            label: toolTitle ?? toolName ?? t('thisTool'),
            onClick: onAllowThisTool,
          },
          {
            key: "allow-all-tools",
            icon: "warning",
            label: `${t('allTools')} (BRRR)`,
            onClick: onAllowAllTools,
          },
        ]}
      />

      <Button size={size}
        variant="primary"
        onClick={onAllow}>
        {t('allow')}
      </Button>

      <Button size={size}
        variant="informative"
        onClick={onDeny}>
        {t('deny')}
      </Button>
    </div>
  );
};
