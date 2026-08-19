import { Markdown } from "../../../ui/markdown/Markdown";
import { useAppStore } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";
import { OpenAIAppWidget } from "../../../ui/widgets/OpenAIAppWidget";
import { copyMarkdownToClipboard } from "../files/file";
import { ImageGrid, MessageList as MessageListComponent, ToolContent, useTheme, VideoGrid } from "aihappey-components";
import type { VideoContent } from "aihappey-components";
import type { ImageContent } from "@modelcontextprotocol/sdk/types";
import type { FileUIPart, SourceDocumentUIPart, SourceUrlUIPart, UIMessage, UIMessagePart } from "aihappey-ai";
import { ChatMessage } from "aihappey-types";
import { useCallback, useMemo, useState, type Ref } from "react";
import { toChatMessages } from "./toChatMessages";
import { getToolName, useTools } from "../../tools/useTools";
import { McpProgressItem, progressRuntime, useMcpProgress } from "../../../runtime/mcp/progressRuntime";
import { getUiMessageIdFromChatMessageId } from "./getUiMessageIdFromChatMessageId";
import { EditMessageModal } from "./EditMessageModal";
import { useConversations } from "aihappey-conversations";
import { ImageModal } from "../../images/ImageModal";
import { downloadImageContent, imageContentToSrc } from "../../images/imageContentUtils";
import { useProviderRegistry } from "../../../runtime/providers/useProviderRegistry";
import { useMessageSpeechPlayback } from "./useMessageSpeechPlayback";

interface MessageListProps {
  showCitations: (items: (SourceUrlUIPart | SourceDocumentUIPart)[]) => void;
  showAttachments?: (attachments: FileUIPart[]) => void;
  showActivity?: (content: UIMessagePart<any, any>[]) => void;
  conversationId?: string;
  messages: UIMessage[];
  scrollContainerRef?: Ref<HTMLDivElement>;
  sendMessage?: any;
  streaming?: boolean;

  /**
   * Optional: patch the live in-memory chat message list (from `useChat()`).
   * This enables instant UI updates without requiring a hard refresh.
   */
  onUiMessagePatched?: (uiMessageId: string, next: UIMessage | undefined) => void;
}

const fileToImageContent = (f: FileUIPart): ImageContent => {
  const url = f?.url ?? "";
  const mt = f?.mediaType ?? "image/png";

  // If FileUIPart.url is a data-url, convert to MCP ImageContent (base64 payload)
  const m = /^data:([^;]+);base64,(.*)$/i.exec(url);
  if (m) {
    return { type: "image", mimeType: m[1], data: m[2] } as any;
  }

  // If url is already base64 without prefix, pass through
  return { type: "image", mimeType: mt, data: url } as any;
};

const fileToVideoContent = (f: FileUIPart): VideoContent => {
  const url = f?.url ?? "";
  const mt = f?.mediaType ?? "video/mp4";

  const m = /^data:([^;]+);base64,(.*)$/i.exec(url);
  if (m) {
    return { type: "base64", mimeType: m[1], data: m[2] };
  }

  return { type: "base64", mimeType: mt, data: url };
};

const fileToAudioSrc = (f: FileUIPart): string | undefined => {
  const url = f?.url ?? "";
  if (!url) return undefined;

  if (
    url.startsWith("data:") ||
    url.startsWith("blob:") ||
    url.startsWith("/") ||
    /^https?:\/\//i.test(url)
  ) {
    return url;
  }

  return `data:${f?.mediaType ?? "audio/mpeg"};base64,${url}`;
};


/**
 * App-layer MessageList:
 * - maps UIMessage[] (Vercel stream) -> ChatMessage[]
 * - injects local "elicitation" messages
 * - renders special blocks (elicitation + openai app widget)
 */
export const MessageList = ({
  showCitations,
  showActivity,
  showAttachments,
  conversationId,
  messages,
  scrollContainerRef,
  sendMessage,
  streaming,
  onUiMessagePatched,
}: MessageListProps) => {
  const { i18n, t } = useTranslation();
  const callTool = useAppStore((s) => s.callTool);
  const showMessageTokens = useAppStore((a) => a.showMessageTokens);
  const disableProviderLogo = useAppStore((a) => a.disableProviderLogo);
  const tools = useTools()
  const providers = useProviderRegistry();
  const { AudioPlayer, Image, Toast } = useTheme()
  const progress = useMcpProgress(progressRuntime);
  const progressByToken = useMemo(() => {
    const m = new Map<string | number, McpProgressItem>();
    for (const p of progress) m.set(p.progressToken, p);
    return m;
  }, [progress]);
  const { refresh } = useConversations();
  const [editUiMessageId, setEditUiMessageId] = useState<string | undefined>(undefined);
  const [modalImage, setModalImage] = useState<ImageContent | undefined>(undefined);
  const [speechToastOpen, setSpeechToastOpen] = useState(false);
  const showSpeechError = useCallback(() => setSpeechToastOpen(true), []);
  const { canSpeak, speak } = useMessageSpeechPlayback({ onError: showSpeechError });
  const editUiMessage = useMemo(
    () => messages.find((m) => m.id === editUiMessageId),
    [editUiMessageId, messages]
  );

  // Keep the UI responsive without requiring a full page reload.
  // When parts/messages change, force the chat list to remount.
  const [uiVersion, setUiVersion] = useState(0);

  // ✅ This hook should output ChatMessage[] (your app adapter layer).
  // If your current hook returns another shape, swap this line to:
  //   const chatMessages = toChatMessages(messages);
  const chatMessages: ChatMessage[] = toChatMessages(messages, providers) as any;
  const copyClipboard = async (msg: ChatMessage) =>
    await copyMarkdownToClipboard(msg.content?.[0].type == "text" ? msg.content?.[0]?.text : JSON.stringify(msg));

  return (
    <>
      <Toast
        id="message-speech-failed"
        variant="error"
        message={t("messageSpeech.failed")}
        show={speechToastOpen}
        autohide={4000}
        onClose={() => setSpeechToastOpen(false)}
      />
      <MessageListComponent
        key={uiVersion}
        scrollContainerRef={scrollContainerRef}
        messages={chatMessages}
        onCopyMessage={copyClipboard}
        locale={i18n.language}
        showTokens={showMessageTokens}
        disableProviderLogo={disableProviderLogo}
        providers={providers}
        tools={tools?.tools ?? []}
        onShowActivity={showActivity}
        onShowSources={showCitations}
        onShowAttachments={showAttachments}
        canSpeakMessage={canSpeak}
        onSpeakMessage={(message) => void speak(message)}
        onEditMessage={(msg: ChatMessage) => {
          const uiMessageId = getUiMessageIdFromChatMessageId(msg.id);
          setEditUiMessageId(uiMessageId);
        }}
        onRenderMarkdown={(text) => <Markdown text={text} streaming={streaming} />}
        renderBlock={({ block }: any) => {

          if (block.type?.startsWith("tool-")
            && block.output?._meta?.["chat/html"]) {
            const html = block.output._meta["chat/html"];

            return (
              <OpenAIAppWidget
                resourceHtml={html}
                toolInput={block?.input}
                sendFollowupTurn={sendMessage}
                onCallTool={(name, args) => callTool(undefined, name, args)}
                meta={block?.output?._meta}
                toolOutput={
                  block?.output?.structuredContent ??
                  block?.output
                }
              />
            );
          }


          if (block.type.startsWith("tool-")) {
            const progress = progressByToken.get(block.toolCallId);
            const toolItem = tools?.tools?.find(a => a.name == getToolName(block?.type))
            return <ToolContent tool={toolItem}
              progress={progress}
              invocation={block} />;
          }

          if (block?.type === "image-grid") {
            const items = (block.items ?? []).map(fileToImageContent);

            if (items.length <= 1) {
              const src = imageContentToSrc(items[0]);
              return src ? (
                <div>
                  <Image
                    src={src}
                    fit="cover"
                    style={{ cursor: "pointer" }}
                    onClick={() => setModalImage(items[0])}
                  />
                </div>
              ) : null;
            }

            return <ImageGrid items={items} columns={3} fit="cover" gap={8} onImageClick={setModalImage} />;
          }

          if (block?.type === "video") {
            const item = block.item ? fileToVideoContent(block.item) : undefined;

            return item ? (
              <VideoGrid
                items={[item]}
                columns={1}
                gap={8}
                shape="rounded"
                style={{ maxWidth: "100%" }}
              />
            ) : null;
          }

          if (block?.type === "audio") {
            const src = block.item ? fileToAudioSrc(block.item) : undefined;

            return src ? (
              <div style={{ width: "100%", maxWidth: 420 }}>
                <AudioPlayer src={src} style={{ width: "100%" }} />
              </div>
            ) : null;
          }

          // fall back to MessageListComponent defaults
          return null;
        }}
      />

      {conversationId && editUiMessageId && editUiMessage ? (
        <EditMessageModal
          open={!!editUiMessageId}
          conversationId={conversationId}
          message={editUiMessage}
          onLocalMessageUpdated={(next) => {
            // Force re-render of the chat UI immediately.
            setUiVersion(v => v + 1);

            // Patch the live chat state when requested.
            onUiMessagePatched?.(editUiMessageId, next);

            // If the whole message was deleted, close modal.
            if (!next) setEditUiMessageId(undefined);
          }}
          onClose={() => {
            setEditUiMessageId(undefined);
            refresh();
          }}
        />
      ) : null}

      {modalImage ? (
        <ImageModal
          open={!!modalImage}
          image={modalImage}
          onDownload={() => downloadImageContent(modalImage)}
          onClose={() => setModalImage(undefined)}
        />
      ) : null}
    </>
  );
};
