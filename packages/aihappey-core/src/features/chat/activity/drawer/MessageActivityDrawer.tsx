import { useTranslation } from "aihappey-i18n";
import { ContentList, useTheme } from "aihappey-components";
import type { ToolUIPart, ReasoningUIPart, DataUIPart } from "aihappey-ai";
import { useIsDesktop } from "../../../../shell/responsive/useIsDesktop";
import { Markdown } from "../../../../ui/markdown/Markdown";

interface MessageActivityDrawerProps {
  open: boolean;
  content: (ReasoningUIPart | ToolUIPart | DataUIPart<any>)[];
  onShowToolCallResult?: (toolCall: ToolUIPart<any>) => void;
  onClose: () => void;
}

export const MessageActivityDrawer = ({
  open,
  content,
  onShowToolCallResult,
  onClose,
}: MessageActivityDrawerProps) => {
  const { Drawer } = useTheme();
  const { t } = useTranslation();
  const isDesktop = useIsDesktop();

  const translations = {
    reasoning: t('reasoning'),
    text: t('text')
  }

  return (
    <Drawer open={open} overlay
      size={isDesktop ? "medium" : "small"}
      onClose={onClose}
      title={t('activity')}>
      <ContentList
        content={content}
        translations={translations}
        onShowToolCallResult={onShowToolCallResult}
        onRenderMarkdown={(msg) => <Markdown text={msg} />} />
    </Drawer>
  );
};
