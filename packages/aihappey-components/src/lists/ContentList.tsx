import { useTheme } from "../theme/ThemeContext";
import type { ChatMessage } from "aihappey-types";
import type { FileUIPart, ToolUIPart, UIMessagePart } from "aihappey-ai";
import { AiWarningBadge } from "../badges";
import { CopyToClipboardButton } from "../buttons";
import { TemperatureBadge } from "../badges/TemperatureBadge";
import { useMemo, useState } from "react";
import { ToolContent } from "../fields/ToolContent";
import { TextCard } from "../cards";
import { ContentCard } from "../cards/ContentCard";

interface ContentListProps {
  content: UIMessagePart<any, any>[];
  onRenderMarkdown: (text: string) => React.ReactElement;
  onShowToolCallResult?: (toolCall: ToolUIPart<any>) => void;
  translations?: any;
}


export const ContentList = ({
  content,
  onRenderMarkdown,
  onShowToolCallResult,
  translations,
}: ContentListProps) => {
  const { Chat, Button, Image, Badge } = useTheme();

  return (
    <div
      style={{
        padding: 8,
        display: "flex",
        flexDirection: "column",
        gap: 12
      }}>
      {content.map(z =>
        <ContentCard
          content={z}
          translations={translations}
          onShowToolCallResult={onShowToolCallResult}
          onRenderMarkdown={onRenderMarkdown}
        />)}
    </div>
  );
};
