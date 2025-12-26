// MessageList.tsx
import { useTheme } from "../theme/ThemeContext";
import type { ChatMessage, IconToken } from "aihappey-types";
import type { FileUIPart, SourceDocumentUIPart, SourceUrlUIPart, UIMessagePart } from "aihappey-ai";
import { useEffect, useState } from "react";
import { ToolContent } from "../fields/ToolContent";
import { MessageActions } from "../buttons/MessageActions";
import type { Tool } from "@modelcontextprotocol/sdk/types";

interface MessageListProps {
  messages: ChatMessage[];
  onRenderMarkdown: (text: string) => React.ReactElement;
  onCopyMessage?: (msg: ChatMessage) => Promise<void>;
  onShowAttachments?: (files: FileUIPart[]) => void;
  onShowSources?: (sources: (SourceDocumentUIPart | SourceUrlUIPart)[]) => void;
  onShowActivity?: (content: UIMessagePart<any, any>[]) => void;
  tools?: Tool[]
  translations?: any;
  size?: string;
  locale?: string

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
const toolMeta = { icon: "tool" as IconToken, label: "tool" };

const BLOCK_META: Record<string, { icon: IconToken; label: string }> = {
  //text: { icon: "text", label: "Text" },
  reasoning: { icon: "brain", label: "reasoning" },
  //file: { icon: "image", label: "Image" },
};

export const MessageList = ({
  messages,
  size,
  onCopyMessage,
  tools,
  translations,
  locale,
  onRenderMarkdown,
  onShowSources,
  onShowActivity,
  onShowAttachments,
  renderBlock,
}: MessageListProps) => {
  const { Chat, Image } = useTheme();

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
    const raw = pageById[key] ?? (msg.content?.length ?? 1) - 1; // default last
    return clamp(raw, 0, getMaxPage(msg));
  };

  const setPage = (msg: ChatMessage, nextPage: number) => {
    const key = getMessageKey(msg);
    const clamped = clamp(nextPage, 0, getMaxPage(msg));
    setPageById(prev => (prev[key] === clamped ? prev : { ...prev, [key]: clamped }));
  };

  // Keep paging state small and avoid stale keys
  useEffect(() => {
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

  const defaultRenderBlock = (block: UIMessagePart<any, any>) => {
    if (!block) return <></>;

    if (block.type === "text") return onRenderMarkdown(block.text);
    if (block.type === "reasoning") return onRenderMarkdown(block.text);

    if (typeof block.type === "string" && block.type.startsWith("tool-")) {
      const toolItem = tools?.find(a => a.name == block.type.replace("tool-", ""))
      return <ToolContent tool={toolItem}
        translations={translations}
        invocation={block} />;
    }

    if (block.type === "file" && block.mediaType?.startsWith("image/")) {
      return (
        <div>
          <Image fit="center" src={block.url} />
        </div>
      );
    }

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

  const renderActions = (msg: ChatMessage) => {
    const page = getPage(msg);
    const max = getMaxPage(msg);

    return (
      <MessageActions
        msg={msg}
        page={page}
        max={max}
        size={size}
        translations={translations}
        onCopyMessage={onCopyMessage}
        onShowSources={onShowSources}
        onShowAttachments={onShowAttachments}
        onShowActivity={onShowActivity}
        onSetPage={(next) => setPage(msg, next)}
      />
    );
  };

  const getBlockMeta = (block: UIMessagePart<any, any> | undefined): any => {
    if (!block) return {};

    if (typeof block.type === "string" && block.type.startsWith("tool-")) {
      return toolMeta;
    }

    return BLOCK_META[block.type] ?? {};
  };

  const messagesWithMeta = messages.map(msg => {
    const page = getPage(msg);
    const block = msg.content?.[page];
    const meta = getBlockMeta(block);

    const label = meta.label ?? msg.messageLabel;

    return {
      ...msg,
      messageIcon: meta.icon ?? msg.messageIcon,
      messageLabel: translations?.[label] ?? label,
    };
  });


  return (
    <div
      id="chat-container"
      style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: 12 }}
    >
      {messagesWithMeta.length > 0 && (
        <Chat
          renderReactions={renderActions}
          renderMessage={onRenderMessage}
          messages={messagesWithMeta}
          locale={locale}
        />
      )}
    </div>
  );
};
