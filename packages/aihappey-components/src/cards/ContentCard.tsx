import { useTheme } from "../theme/ThemeContext";
import type { ChatMessage } from "aihappey-types";
import type { FileUIPart, ToolUIPart, UIMessagePart } from "aihappey-ai";
import { AiWarningBadge } from "../badges";
import { CopyToClipboardButton } from "../buttons";
import { TemperatureBadge } from "../badges/TemperatureBadge";
import { useMemo, useState } from "react";
import { ToolContent } from "../fields/ToolContent";
import { ReasoningCard, TextCard, ToolInvocationCard } from "../cards";

interface ContentCardProps {
  content: UIMessagePart<any, any>;
  onRenderMarkdown: (text: string) => React.ReactElement;
  translations?: any;
  onShowToolCallResult?: (toolCall: ToolUIPart<any>) => void;
}


export const ContentCard = ({
  content,
  onRenderMarkdown,
  onShowToolCallResult,
  translations,
}: ContentCardProps) => {
  const { Chat, Button, Image, Badge } = useTheme();

  switch (content.type) {
    case "text":
      return <TextCard
        block={content}
        translations={translations}
        renderText={onRenderMarkdown} />
    case "reasoning":
      return <ReasoningCard
        translations={translations}
        block={content}
        renderText={onRenderMarkdown} />
    default:
      if (content.type.startsWith("tool-"))
        return <ToolInvocationCard
          onShowOutput={onShowToolCallResult ? () => onShowToolCallResult(content as ToolUIPart<any>) : undefined}
          invocation={content} />

      return <>Render missing for type {content.type}</>
  }
};
