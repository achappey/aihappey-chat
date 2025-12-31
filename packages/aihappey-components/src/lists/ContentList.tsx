import { useTheme } from "../theme/ThemeContext";
import type { ToolUIPart, UIMessagePart } from "aihappey-ai";
import { UIMessagePartCard } from "../cards/UIMessagePartCard";

interface ContentListProps {
  content: UIMessagePart<any, any>[];
  onRenderMarkdown: (text: string) => React.ReactElement;
  onShowToolCallResult?: (toolCall: ToolUIPart<any>) => void;
}

export const ContentList = ({
  content,
  onRenderMarkdown,
  onShowToolCallResult,
}: ContentListProps) => {
  return (
    <div
      style={{
        padding: 8,
        display: "flex",
        flexDirection: "column",
        gap: 12
      }}>
      {content.map(z =>
        <UIMessagePartCard
          content={z}
          onShowToolCallResult={onShowToolCallResult}
          onRenderMarkdown={onRenderMarkdown}
        />)}
    </div>
  );
};
