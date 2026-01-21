// MessageActions.tsx
import type { ChatMessage } from "aihappey-types";
import type { FileUIPart, SourceDocumentUIPart, SourceUrlUIPart, UIMessagePart } from "aihappey-ai";
import { useTheme } from "../theme/ThemeContext";
import { AiWarningBadge, TokenBadge } from "../badges";
import { CopyToClipboardButton } from "../buttons";
import { TemperatureBadge } from "../badges/TemperatureBadge";
import { useMediaQuery } from "usehooks-ts";

interface MessageActionsProps {
  msg: ChatMessage;
  page: number;
  max: number;
  size?: string;
  showTemperature?: boolean
  showTokens?: boolean

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
  showTemperature,
  showTokens,
  onCopyMessage,
  onShowAttachments,
  onShowActivity,
  onShowSources,
  onSetPage,
}: MessageActionsProps) => {
  const { Button } = useTheme();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <>
      {msg.role === "assistant" && (
        <AiWarningBadge size={size ?? isDesktop ? undefined : "small"} />
      )}

      {onCopyMessage && (
        <CopyToClipboardButton
          onClick={() => onCopyMessage(msg)}
          size={size} />
      )}

      {showTemperature
        && msg.role === "assistant"
        && msg.temperature != undefined && (
          <TemperatureBadge temperature={msg.temperature} />
        )}

      {showTokens && <TokenBadge totalTokens={msg.totalTokens} />}

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

      {onShowAttachments
        && msg?.attachments
        && msg?.attachments?.length > 0 && (
          <Button
            variant="subtle"
            style={{ minWidth: 10, paddingLeft: 5, paddingRight: 5 }}
            onClick={() => onShowAttachments(msg.attachments ?? [])}
            icon={"attachment"}
          >
            {msg.attachments.length}
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
        msg?.content?.length > 1 &&
        msg?.messageLabel && (
          <Button
            variant="subtle"
            style={{ minWidth: 10, paddingLeft: 5, paddingRight: 5 }}
            onClick={() => onShowActivity(msg.content ?? [])}
            icon={"cardList"}
          />
        )}
    </>
  );
};
