import { Markdown } from "../../../ui/markdown/Markdown";
import { SamplingRequest, useAppStore } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";
import { OpenAIAppWidget } from "../../../ui/widgets/OpenAIAppWidget";
import { ElicitationForm } from "../../elicitation/ElicitationForm";
import { copyMarkdownToClipboard } from "../files/file";
import { elicitRuntime, useOpenElicits } from "../../../runtime/mcp/elicitRuntime";
import { MessageList as MessageListComponent } from "aihappey-components";
import type { CreateMessageRequest, CreateMessageResult, ElicitResult } from "@modelcontextprotocol/sdk/types";
import type { UIMessage, UIMessagePart } from "aihappey-ai";
import { ChatMessage } from "aihappey-types";
import { useMemo } from "react";
import { toChatMessages } from "./toChatMessages";
import { samplingRuntime, useOpenSamplings } from "../../../runtime/mcp/samplingRuntime";
import { useTools } from "../../tools/useTools";

interface MessageListProps {
  showCitations: (items: any[]) => void;
  showToolsDrawer?: (tools: any[]) => void;
  showAttachments?: (attachments: any[]) => void;
  showActivity?: (content: UIMessagePart<any, any>[]) => void;
  conversationId?: string;
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
}: MessageListProps) => {
  const { t, i18n } = useTranslation();
  const callTool = useAppStore((s) => s.callTool);
  const sampling = useAppStore((a) => a.sampling);
  const tools = useTools()
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
      input: t("input"),
      reasoning: t("reasoning")
    }),
    [t]
  );
  const copyClipboard = async (msg: ChatMessage) =>
    await copyMarkdownToClipboard(msg.content?.[0].type == "text" ? msg.content?.[0]?.text : JSON.stringify(msg));

  return (
    <MessageListComponent
      messages={merged}
      onCopyMessage={copyClipboard}
      locale={i18n.language}
      translations={translations}
      tools={tools?.tools ?? []}
      onShowActivity={showActivity}
      onShowSources={showCitations}
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
        }

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

        // fall back to MessageListComponent defaults
        return null;
      }}
    />
  );
};