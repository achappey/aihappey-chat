import { Markdown } from "../../../ui/markdown/Markdown";
import { SamplingRequest, useAppStore } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";
import { OpenAIAppWidget } from "../../../ui/widgets/OpenAIAppWidget";
import { ElicitationForm } from "../../elicitation/ElicitationForm";
import { copyMarkdownToClipboard, downloadBase64Image } from "../files/file";
import { elicitRuntime, useOpenElicits } from "../../../runtime/mcp/elicitRuntime";
import { useTheme, MessageList as MessageListComponent, SamplingCard } from "aihappey-components";
import type { CreateMessageRequest, CreateMessageResult, ElicitResult } from "@modelcontextprotocol/sdk/types";
import type { UIMessage, UIMessagePart } from "aihappey-ai";
import { ChatMessage } from "aihappey-types";
import { useMemo } from "react";
import { toChatMessages } from "./toChatMessages";
import { samplingRuntime, useOpenSamplings } from "../../../runtime/mcp/samplingRuntime";

interface MessageListProps {
  showCitations: (items: any[]) => void;
  showToolsDrawer?: (tools: any[]) => void;
  showAttachments?: (attachments: any[]) => void;
  showActivity?: (content: UIMessagePart<any, any>[]) => void;
  conversationId?: string;
  status: "submitted" | "streaming" | "ready" | "error";
  messages: UIMessage[];
  sendMessage?: any;
}

/**
 * App-layer MessageList:
 * - maps UIMessage[] (Vercel stream) -> ChatMessage[]
 * - injects local "elicitation" messages
 * - renders special blocks (elicitation + openai app widget)
 */
export const MessageList = ({
  showCitations,
  showToolsDrawer,
  showActivity,
  showAttachments,
  messages,
  sendMessage,
  status,
}: MessageListProps) => {
  const { t } = useTranslation();
  const callTool = useAppStore((s) => s.callTool);
  const sampling = useAppStore((a) => a.sampling);

  // ✅ This hook should output ChatMessage[] (your app adapter layer).
  // If your current hook returns another shape, swap this line to:
  //   const chatMessages = toChatMessages(messages);
  const chatMessages: ChatMessage[] = toChatMessages(messages) as any;
  const openSampling = useOpenSamplings(samplingRuntime)
  const mergedSampling = useMemo(() => {
    const byId = new Map<string, {
      id: string; createdAt: string; serverUrl: string; request: CreateMessageRequest;
      result?: CreateMessageResult
    }>();

    // completed first
    for (const [id, tuple] of Object.entries(sampling)) {
      const [createdAt, serverUrl, request, result] = tuple as SamplingRequest;
      byId.set(id, { id, createdAt, serverUrl, request, result });
    }

    // running overwrites (prevents duplicate render)
    for (const s of openSampling) {
      const existing = byId.get(s.id);
      byId.set(s.id, {
        id: s.id,
        createdAt: existing?.createdAt ?? s.createdAt,
        serverUrl: s.serverUrl,
        request: s.request,
        result: existing?.result,
      });
    }

    return [...byId.values()].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  }, [openSampling, sampling]);


  const mergedSampling2 = useMemo<SamplingRequest[]>(() => {
    const running: SamplingRequest[] =
      openSampling.map(s => ([
        s.createdAt,
        s.serverUrl,
        s.request,
        null as any, // running
      ]));

    const completed: SamplingRequest[] =
      Object.values(sampling);

    // runtime items are always the newest → place them first
    return [...running, ...completed.slice(running.length)];
  }, [sampling]);

  const samplingMessages: ChatMessage[] = mergedSampling.map((a, i) => ({
    id: a.id,
    role: "assistant",
    createdAt: new Date(a.createdAt).toString(),
    messageIcon: "chat",
    messageLabel: t('sampling') ?? "sampling",
    // Inject as a synthetic block type that the renderer can catch
    content: a.result ? [
      {
        type: "text",
        // request: a.request,
        text: ((a.request?.params?.messages?.[0] as any).content as any)?.text,
      },
      {
        type: "text",
        //request: a.request,
        text: (a.result.content as any)?.text
      }
    ] : [
      {
        type: "text",
        request: a.request,
        text: ((a.request?.params?.messages?.[0] as any).content as any)?.text,
      },
    ],
  })) as any;


  // --- Elicitation injection (local UI messages)
  const elicitationRequests = useOpenElicits(elicitRuntime);
  const elicitMessages: ChatMessage[] = elicitationRequests.map((a, i) => ({
    id: a.id,
    role: "assistant",
    createdAt: new Date(a.createdAt).toString(),

    // Inject as a synthetic block type that the renderer can catch
    content: [
      {
        type: "elicitation",
        params: a.request.params,
        onRespond: (r: ElicitResult) => elicitRuntime.respond(a.id, r),
      },
    ],
  })) as any;

  //const all = [...chatMessages, ...elicitMessages, ...samplingMessages];
  const all = [...chatMessages, ...elicitMessages];
  const merged2: ChatMessage[] =
    // stable-ish ordering
    [...all].sort(
      (x: any, y: any) => (Date.parse(x.createdAt) ?? 0) - (Date.parse(y.createdAt) ?? 0)
    );

  const merged: ChatMessage[] = useMemo(() => {
    // stable-ish ordering
    return [...all].sort(
      (x: any, y: any) => (Date.parse(x.createdAt) ?? 0) - (Date.parse(y.createdAt) ?? 0)
    );
  }, [chatMessages, elicitMessages, samplingMessages]);

  const translations = useMemo(
    () => ({
      generatedByAi: t("generatedByAi"),
      input: t("input")
    }),
    [t]
  );
  const copyClipboard = async (msg: ChatMessage) =>
    await copyMarkdownToClipboard(msg.content?.[0].type == "text" ? msg.content?.[0]?.text : JSON.stringify(msg));

  return (
    <MessageListComponent
      messages={merged}
      onCopyMessage={copyClipboard}
      translations={translations}
      onShowActivity={showActivity}
      onShowAttachments={showAttachments}
      onRenderMarkdown={(text) => <Markdown text={text} />}
      renderBlock={({ block }: any) => {
        // 1) Elicitation form injection
        if (block?.type === "elicitation") {
          return (
            <ElicitationForm
              params={block.params}
              onRespond={block.onRespond}
            />
          );
        }

        if (block?.type === "sampling") {
          return (
            <Markdown
              text={((block.request?.params?.messages?.[0] as any).content as any)?.text}
            />
          );

          return (
            <SamplingCard
              request={block.request}
              result={block.result}
            />
          );
        }

        // 2) "OpenAI App" widget (HTML payload)
        // Supports either:
        // - block.mimeType === "text/html+skybridge"
        // - or block.type === "openai-app"
        if (block.type?.startsWith("tool-") && block.output?._meta?.["chat/html"]) {
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

        // fall back to MessageListComponent defaults
        return null;
      }}
    />
  );
};


interface MessageListProps2 {
  showCitations: (items: any[]) => void;
  showToolsDrawer?: (tools: any[]) => void;
  showAttachments?: (attachments: any[]) => void;
  conversationId?: string
  status: "submitted" | "streaming" | "ready" | "error";
  messages: UIMessage[];
  sendMessage?: any
}

export const MessageList2 = ({
  showCitations,
  showToolsDrawer,
  showAttachments,
  messages,
  sendMessage,
  status,
}: MessageListProps2) => {
  const { Chat } = useTheme();
  //const chatMessageData = useChatMessages(messages);
  const { t } = useTranslation();
  const callTool = useAppStore((s) => s.callTool);
  //const elicitationRequests = elicitRuntime.getOpenElicits()
  const elicitationRequests = useOpenElicits(elicitRuntime);
  var elicitMessages: any[] = elicitationRequests
    .map((a) => ({
      id: a.id,
      role: "assistant",
      author: a.id,
      isImage: false,
      elicit: a.request.params,
      onRespond: (r: ElicitResult) => elicitRuntime.respond(a.id, r),
      text: JSON.stringify(a.request.params),
    }));
  /*
    const chatMessages = chatMessageData.map((m) => ({
      ...m,
      // content: <MemoMarkdown text={m.contentText} />,
      text: m.contentText,
      copyToClipboard: m.isImage
        ? undefined
        : async () => await copyMarkdownToClipboard(m.contentText),
      download: m.isImage
        ? () => {
          // Heuristically find a file extension (data-url or url)
          let url = "";
          let ext = "png";
          if (m.contentText.startsWith("![")) {
            // Try to extract URL from markdown image
            const match = /\]\((.*?)\)/.exec(m.contentText);
            if (match) url = match[1];
            if (url.startsWith("data:")) {
              const mime = url.split(";")[0].split(":")[1];
              ext = mime?.split("/")[1] || "png";
            }
          }
          downloadBase64Image(url, `${m.id}.${ext}`);
        }
        : undefined,
    }));*/

  const translations = {
    generatedByAi: t("generatedByAi")
  }

  return <MessageListComponent messages={[]}
    translations={translations}
    onCopyMessage={async (msg) => await copyMarkdownToClipboard("")}
    onRenderMarkdown={
      (msg) => <Markdown text={msg} />
    } />
};

/*
export const MessageList2 = ({
  showCitations,
  showToolsDrawer,
  showAttachments,
  messages,
  sendMessage,
  status,
}: MessageListProps) => {
  const { Chat } = useTheme();
  const chatMessageData = useChatMessages(messages);
  const { t } = useTranslation();
  const callTool = useAppStore((s) => s.callTool);
  //const elicitationRequests = elicitRuntime.getOpenElicits()
  const elicitationRequests = useOpenElicits(elicitRuntime);
  var elicitMessages: any[] = elicitationRequests
    .map((a) => ({
      id: a.id,
      role: "assistant",
      author: a.id,
      isImage: false,
      elicit: a.request.params,
      onRespond: (r: ElicitResult) => elicitRuntime.respond(a.id, r),
      text: JSON.stringify(a.request.params),
    }));

  const chatMessages = chatMessageData.map((m) => ({
    ...m,
    // content: <MemoMarkdown text={m.contentText} />,
    text: m.contentText,
    copyToClipboard: m.isImage
      ? undefined
      : async () => await copyMarkdownToClipboard(m.contentText),
    download: m.isImage
      ? () => {
        // Heuristically find a file extension (data-url or url)
        let url = "";
        let ext = "png";
        if (m.contentText.startsWith("![")) {
          // Try to extract URL from markdown image
          const match = /\]\((.*?)\)/.exec(m.contentText);
          if (match) url = match[1];
          if (url.startsWith("data:")) {
            const mime = url.split(";")[0].split(":")[1];
            ext = mime?.split("/")[1] || "png";
          }
        }
        downloadBase64Image(url, `${m.id}.${ext}`);
      }
      : undefined,
  }));

  return (
    <div id="chat-container"
      style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: 12 }}
    >
      {chatMessages.length > 0 && (
        <Chat
          onShowSources={showCitations}
          onShowAttachments={showAttachments}
          generatedByAiLabel={t("generatedByAi")}
          renderMessage={(msg) => {
            if (msg?.elicit) {
              return (
                <ElicitationForm
                  params={msg?.elicit}
                  onRespond={msg.onRespond}
                />
              );
            }

            // 🧠 Widget message
            if (msg?.id?.indexOf("-widget-") > -1) {
              return (
                <OpenAIAppWidget
                  resourceHtml={msg.text}
                  toolInput={msg.tools?.[0]?.input}
                  sendFollowupTurn={sendMessage}
                  onCallTool={(name, args) => callTool(undefined, name, args)}
                  meta={msg.tools?.[0]?.output?._meta}
                  toolOutput={msg.tools?.[0]?.output?.structuredContent}
                />
              );
            }

            // 🧾 Regular text
            return <MemoMarkdown text={msg.text} status={status} />;
          }}
          generatedByAiWarning={t("generatedByAiWarning")}
          messages={[...chatMessages, ...elicitMessages]}
          onShowTools={showToolsDrawer}
        />
      )}
    </div>
  );
};*/