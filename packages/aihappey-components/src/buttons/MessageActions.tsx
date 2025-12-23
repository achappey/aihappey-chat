// MessageActions.tsx
import type { ChatMessage } from "aihappey-types";
import type { FileUIPart, SourceDocumentUIPart, SourceUrlUIPart, UIMessagePart } from "aihappey-ai";
import { useTheme } from "../theme/ThemeContext";
import { AiWarningBadge } from "../badges";
import { CopyToClipboardButton } from "../buttons";
import { TemperatureBadge } from "../badges/TemperatureBadge";

interface MessageActionsProps {
  msg: ChatMessage;
  page: number;
  max: number;
  size?: string;
  translations?: any;

  onCopyMessage?: (msg: ChatMessage) => Promise<void>;
  onShowAttachments?: (files: FileUIPart[]) => void;
  onShowActivity?: (content: UIMessagePart<any, any>[]) => void;
  onShowSources?: (sources: (SourceDocumentUIPart | SourceUrlUIPart)[]) => void;
  onSetPage: (nextPage: number) => void;
}

export const MessageActions = ({
  msg,
  page,
  max,
  size,
  translations,
  onCopyMessage,
  onShowAttachments,
  onShowActivity,
  onShowSources,
  onSetPage,
}: MessageActionsProps) => {
  const { Button, Badge } = useTheme();

  const tokenBadge =
    msg.totalTokens && msg.totalTokens > 0 ? (
      <Badge icon={"code"} size="large" bg="subtle" appearance="ghost">
        {msg.totalTokens}
      </Badge>
    ) : undefined;

  return (
    <div style={{ height: 16, paddingTop: 8, display: "flex", alignItems: "center" }}>
      {msg.role === "assistant" && (
        <AiWarningBadge label={translations?.generatedByAi ?? "generatedByAi"} size={size} />
      )}

      {onCopyMessage && (
        <CopyToClipboardButton onClick={() => onCopyMessage(msg)} size={size} />
      )}

      {msg.role === "assistant" && (msg as any).temperature != undefined && (
        <TemperatureBadge temperature={(msg as any).temperature} />
      )}

      {tokenBadge}

      {onShowAttachments && msg?.attachments && msg?.attachments?.length > 0 && (
        <Button
          variant="subtle"
          style={{ minWidth: 10, paddingLeft: 5, paddingRight: 5 }}
          onClick={() => onShowAttachments(msg.attachments ?? [])}
          icon={"attachment"}
        >
          {msg.attachments.length}
        </Button>
      )}

      {onShowSources
        && msg?.sources
        && msg?.sources?.length > 0 && (
          <Button
            variant="subtle"
            style={{ minWidth: 10, paddingLeft: 5, paddingRight: 5 }}
            onClick={() => onShowSources(msg.sources ?? [])}
            icon={"sources"}
          >
            {msg.sources.length}
          </Button>
        )}

      {max > 0 && (
        <Button
          variant="subtle"
          size="large"
          disabled={page <= 0}
          onClick={() => onSetPage(page - 1)}
          icon={"chevronLeft"}
        />
      )}

      {max > 0 && <span>{page + 1}/{max + 1}</span>}

      {max > 0 && (
        <Button
          variant="subtle"
          size="large"
          disabled={page >= max}
          onClick={() => onSetPage(page + 1)}
          icon={"chevronRight"}
        />
      )}

      {onShowActivity &&
        msg?.messageIcon &&
        msg?.content?.length > 0 &&
        msg?.messageLabel && (
          <Button
            variant="subtle"
            style={{ minWidth: 10, paddingLeft: 5, paddingRight: 5 }}
            onClick={() => onShowActivity(msg.content ?? [])}
            icon={"cardList"}
          />
        )}
    </div>
  );
};
