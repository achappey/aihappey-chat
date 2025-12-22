import { useTheme } from "../theme/ThemeContext";
import type { ChatMessage } from "aihappey-types";
import type { FileUIPart, UIMessagePart } from "aihappey-ai";
import { AiWarningBadge } from "../badges";
import { CopyToClipboardButton } from "../buttons";
import { TemperatureBadge } from "../badges/TemperatureBadge";
import { useMemo, useState } from "react";
import { ToolContent } from "../fields/ToolContent";

interface MessageListProps {
  messages: ChatMessage[];
  onRenderMarkdown: (text: string) => React.ReactElement;
  onCopyMessage?: (msg: ChatMessage) => Promise<void>;
  onShowAttachments?: (files: FileUIPart[]) => void;
  onShowActivity?: (content: UIMessagePart<any, any>[]) => void;
  translations?: any;
  size?: string;

  /**
   * Optional hook to override rendering for a specific block.
   * Return null/undefined to fall back to default rendering.
   */
  renderBlock?: (args: {
    msg: ChatMessage;
    block: any;
    index: number;
  }) => React.ReactElement | null | undefined;
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export const MessageList = ({
  messages,
  size,
  onCopyMessage,
  translations,
  onRenderMarkdown,
  onShowActivity,
  onShowAttachments,
  renderBlock,
}: MessageListProps) => {
  const { Chat, Button, Image, Badge } = useTheme();

  // Per-message paging state (for messages with multiple blocks/pages)
  const [pageById, setPageById] = useState<Record<string, number>>({});

  const getMessageKey = (msg: ChatMessage) => {
    // Adjust if your ChatMessage uses a different field name
    return (
      (msg as any).id ??
      (msg as any).messageId ??
      `${msg.role}:${(msg as any).createdAt ?? ""}`
    );
  };

  const getMaxPage = (msg: ChatMessage) => Math.max(0, (msg.content?.length ?? 1) - 1);

  const getPage = (msg: ChatMessage) => {
    const key = getMessageKey(msg);
    const raw = pageById[key] ?? msg.content?.length - 1;
    return clamp(raw, 0, getMaxPage(msg));
  };

  const setPage = (msg: ChatMessage, nextPage: number) => {
    const key = getMessageKey(msg);
    const clamped = clamp(nextPage, 0, getMaxPage(msg));
    setPageById(prev => (prev[key] === clamped ? prev : { ...prev, [key]: clamped }));
  };

  // If messages change (e.g., new chat), optionally prune pageById keys
  // (keeps state small + avoids stale keys)
  useMemo(() => {
    const keys = new Set(messages.map(getMessageKey));
    setPageById(prev => {
      const next: Record<string, number> = {};
      let changed = false;
      for (const k of Object.keys(prev)) {
        if (keys.has(k)) next[k] = prev[k];
        else changed = true;
      }
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const renderActions = (msg: ChatMessage) => {
    const page = getPage(msg);
    const max = getMaxPage(msg);
    const tokenBadge = msg.totalTokens && msg.totalTokens > 0 ? <Badge
      icon={'code'}
      size="large"
      bg="subtle"
      appearance="ghost"
    >
      {msg.totalTokens}
    </Badge> : undefined;

    return (
      <div style={{ height: 16, paddingTop: 8, display: "flex", alignItems: "center" }}>
        {msg.role === "assistant" && (
          <AiWarningBadge
            label={translations?.generatedByAi ?? "generatedByAi"}
            size={size}
          />
        )}

        {onCopyMessage &&
          <CopyToClipboardButton
            onClick={() => onCopyMessage(msg)}
            size={size}
          />}

        {msg.role === "assistant"
          && (msg as any).temperature != undefined
          && <TemperatureBadge temperature={(msg as any).temperature} />}

        {tokenBadge}

        {onShowAttachments
          && msg?.attachments
          && msg?.attachments?.length > 0 && (
            <Button
              variant="subtle"
              style={{
                minWidth: 10,
                paddingLeft: 5,
                paddingRight: 5
              }}
              onClick={() => onShowAttachments(msg?.attachments ?? [])}
              icon={"attachment"}
            >{msg?.attachments?.length}</Button>
          )}


        {max > 0 && (
          <Button
            variant="subtle"
            size="large"
            disabled={page <= 0}
            onClick={() => setPage(msg, page - 1)}
            icon={"chevronLeft"}
          />
        )}

        {max > 0 && (
          <span>
            {page + 1}/{max + 1}
          </span>
        )}

        {max > 0 && (
          <Button
            variant="subtle"
            size="large"
            disabled={page >= max}
            onClick={() => setPage(msg, page + 1)}
            icon={"chevronRight"}
          />
        )}

        {onShowActivity
          && msg?.messageIcon
          && msg?.content?.length > 0
          && msg?.messageLabel && (
            <Button
              variant="subtle"
              style={{
                minWidth: 10,
                paddingLeft: 5,
                paddingRight: 5
              }}
              onClick={() => onShowActivity(msg?.content ?? [])}
              icon={"cardList"}
            />
          )}
      </div>
    );
  };

  const defaultRenderBlock = (block: UIMessagePart<any, any>) => {
    if (!block) return <></>;

    if (block.type === "text") return onRenderMarkdown(block.text);
    if (block.type === "reasoning") return onRenderMarkdown(block.text);
    if (typeof block.type === "string" && block.type.startsWith("tool-"))
      return <ToolContent translations={translations} invocation={block} />;

    if (block.type === "file" && block.mediaType?.startsWith("image/"))
      return <div><Image fit="center" src={block.url} /></div>

    return (
      <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
        {JSON.stringify(block, null, 2)}
      </pre>
    );
  };

  const onRenderMessage = (msg: ChatMessage) => {
    const page = getPage(msg);
    const block = msg.content?.[page];
    if (!block) return <></>;

    const custom = renderBlock?.({ msg, block, index: page });
    if (custom) return custom;

    return defaultRenderBlock(block);
  };

  return (
    <div
      id="chat-container"
      style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: 12 }}>
      {messages.length > 0 && (
        <Chat
          renderReactions={renderActions}
          renderMessage={onRenderMessage}
          messages={messages}
        />
      )}
    </div>
  );
};
