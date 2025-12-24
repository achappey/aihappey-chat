import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { ToolInvocationCard } from "../chat/activity/content/ToolInvocationCard";
import { useIsDesktop } from "../../shell/responsive/useIsDesktop";

interface ToolDrawerProps {
  open: boolean;
  tools: any[];
  onClose: () => void;
}

export const ToolDrawer = ({ open, tools, onClose }: ToolDrawerProps) => {
  const { Drawer } = useTheme();
  const { t } = useTranslation();
  const isDesktop = useIsDesktop();

  return (
    <Drawer open={open}
      size={isDesktop ? "medium" : "small"}
      overlay
      title={t("mcp.tools")}
      onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {tools.map((tool, i) => (
          <ToolInvocationCard
            invocation={{
              type: tool.type,
              input: tool.input,
              state: tool.state,
              output: tool.output,
              toolCallId: tool.toolCallId,
            }}
          />
        ))}
      </div>
    </Drawer>
  );
};
