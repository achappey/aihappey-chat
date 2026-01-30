import type { ReactNode } from "react";
import type { IconToken } from "aihappey-types";
import { useTheme } from "../theme/ThemeContext";
import { useDarkMode } from "usehooks-ts";

export type StickyHeaderActionBarProps = {
  actionLabel: string;
  onAction: () => void;
  actionIcon?: IconToken;
  actionVariant?: string;
  actionDisabled?: boolean;
  leftContent?: ReactNode;
  rightContent?: ReactNode;
};

export const StickyHeaderActionBar = ({
  actionLabel,
  onAction,
  actionIcon = "add",
  actionVariant = "primary",
  actionDisabled,
  leftContent,
  rightContent,
}: StickyHeaderActionBarProps) => {
  const { Button } = useTheme();
  const { isDarkMode } = useDarkMode();

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        height: 48,
        display: "flex",
        alignItems: "center",
        padding: "0 12px"
      }}
    >
      <div style={{ flex: 1 }}>{leftContent}</div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {rightContent}
        <Button
          type="button"
          variant={actionVariant as any}
          icon={actionIcon}
          disabled={actionDisabled}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  );
};
