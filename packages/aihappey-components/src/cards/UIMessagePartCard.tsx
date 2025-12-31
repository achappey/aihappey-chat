import type { ToolUIPart, UIMessagePart } from "aihappey-ai";
import { ReasoningCard, TextCard, ToolInvocationCard } from ".";

interface UIMessagePartCardProps {
  content: UIMessagePart<any, any>;
  onRenderMarkdown: (text: string) => React.ReactElement;
  onShowToolCallResult?: (toolCall: ToolUIPart<any>) => void;
}

export const UIMessagePartCard = ({
  content,
  onRenderMarkdown,
  onShowToolCallResult,
}: UIMessagePartCardProps) => {
  switch (content.type) {
    case "text":
      return <TextCard
        block={content}
        renderText={onRenderMarkdown} />
    case "reasoning":
      return <ReasoningCard
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
