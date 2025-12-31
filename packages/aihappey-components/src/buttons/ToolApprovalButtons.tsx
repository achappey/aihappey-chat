import { useTheme } from "../theme/ThemeContext";
import { ViewButton } from "./ViewButton";

export type ToolApprovalButtonTranslations = {
  automatic: string;
  allow: string;
  deny: string;
  thisTool: (args: { toolName?: string }) => string;
  allTools: string;
};

type ToolApprovalButtonsProps = {
  size?: "small" | "medium";
  toolName?: string;
  toolTitle?: string;
  canViewOutput?: boolean;

  translations: ToolApprovalButtonTranslations;

  onViewOutput?: () => void;
  onAllow: () => void;
  onDeny: () => void;
  onAllowThisTool: () => void;
  onAllowAllTools: () => void;
};

export const ToolApprovalButtons = ({
  size = "small",
  toolName,
  toolTitle,
  canViewOutput,
  translations,
  onViewOutput,
  onAllow,
  onDeny,
  onAllowThisTool,
  onAllowAllTools,
}: ToolApprovalButtonsProps) => {
  const { Button, SplitButton } = useTheme();

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
        label={translations.automatic}
        variant="secondary"
        onClick={onAllowThisTool}
        menuItems={[
          {
            key: "allow-this-tool",
            label: translations.thisTool({
              toolName: toolTitle ?? toolName,
            }),
            onClick: onAllowThisTool,
          },
          {
            key: "allow-all-tools",
            icon: "warning",
            label: `${translations.allTools} (YOLO)`,
            onClick: onAllowAllTools,
          },
        ]}
      />

      <Button size={size} variant="primary" onClick={onAllow}>
        {translations.allow}
      </Button>

      <Button size={size} variant="informative" onClick={onDeny}>
        {translations.deny}
      </Button>
    </div>
  );
};
