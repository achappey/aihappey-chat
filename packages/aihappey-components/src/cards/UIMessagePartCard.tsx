import type { ToolUIPart, UIMessagePart } from "aihappey-ai";
import { ReasoningCard, TextCard, ToolInvocationCard } from ".";

interface UIMessagePartCardProps {
  content: UIMessagePart<any, any>;
  onRenderMarkdown: (text: string) => React.ReactElement;
  translations?: any;
  onShowToolCallResult?: (toolCall: ToolUIPart<any>) => void;
}

export const UIMessagePartCard = ({
  content,
  onRenderMarkdown,
  onShowToolCallResult,
  translations,
}: UIMessagePartCardProps) => {
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
