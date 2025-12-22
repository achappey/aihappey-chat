import { ChatMessage } from "aihappey-types";
import type { FileUIPart, ToolUIPart, UIMessage } from "aihappey-ai";

export function toChatMessages(
  messages: UIMessage[],
  translations?: any
): ChatMessage[] {
  const out: ChatMessage[] = [];

  for (const z of messages) {
    if (z.role === "system") continue;

    const meta = (z.metadata ?? {}) as any;
    const createdAt = meta?.timestamp;
    const author = meta?.author ?? meta?.model;
    const temperature = meta?.temperature;
    const totalTokens = meta?.totalTokens;

    const parts = ((z.parts ?? [])).filter(p => p?.type !== "step-start");

    // Helper: push one buffered activity message
    let activityRun: any[] = [];
    let activityRunStartIndex: number | null = null;

    const flushActivity: any = () => {
      if (!activityRun.length) return;

      out.push({
        id: `${z.id}:activity:${activityRunStartIndex ?? 0}`,
        role: z.role,
        content: activityRun, // IMPORTANT: keep original parts separate + ordered
        createdAt,
        author,
        temperature,
        messageIcon: "tool", // or "dots" if you have it
        messageLabel: translations?.activity ?? "activity",
      } as any);

      activityRun = [];
      activityRunStartIndex = null;
    };

    // Non-assistant: keep exact ordering too
    // (same rule: text stands alone, everything else grouped between texts)
    if (z.role !== "assistant") {
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        const t = p?.type;

        if (t === "text") {
          flushActivity();
          out.push({
            id: `${z.id}:text:${i}`,
            role: z.role,
            content: [p],
            attachments: parts?.filter(a => a.type == "file"),
            createdAt,
            author,
          });
          continue;
        }

        if (activityRunStartIndex === null) activityRunStartIndex = i;

        if (t !== "file")
          activityRun.push(p);
      }

      flushActivity();
      continue;
    }

    // Assistant: same grouping logic
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      const t = p?.type;

      if (t === "text") {
        // activity happened before this text -> show it between messages
        flushActivity();

        // let content = [p]
        if (p.type == "text"
          && p.text == ''
          && parts?.some(a => a.type == "file"
            && a.mediaType.startsWith("image/"))) {

          const imagesHtml =
            parts
              ?.filter((p): p is FileUIPart =>
                p.type === "file" && !!p.mediaType?.startsWith("image/")
              )
              .map(a => `<img src="${a.url}" alt="image" />`)
              .join("\n") ?? "";

          p.text = imagesHtml
        }

        out.push({
          id: `${z.id}:text:${i}`,
          role: z.role,
          content: [p],
          attachments: parts?.filter(a => a.type == "file"),
          createdAt,
          author,
          temperature,
          totalTokens
        });
        continue;
      }

      if (p.type.startsWith("tool-") && ((p as ToolUIPart).output as any)?._meta?.["chat/html"]) {
       // activityRun.push(p);
        // activity happened before this text -> show it between messages
        flushActivity();

        out.push({
          id: `${z.id}:widget:${i}`,
          role: z.role,
          content: [p as any],
          //attachments: parts?.filter(a => a.type == "file"),
          createdAt,
          author,
          temperature,
          totalTokens
        });

        continue;
      }


      // any non-text is "activity" (reasoning/tool/other) and gets grouped,
      // but ordering stays exactly as in parts[]
      if (activityRunStartIndex === null) activityRunStartIndex = i;
      if (t !== "file")
        activityRun.push(p);
    }

    flushActivity();
  }

  return out;
}


export function toChatMessages2(
  messages: UIMessage[],
  translations?: any
): ChatMessage[] {
  const out: ChatMessage[] = [];

  for (const z of messages) {
    if (z.role === "system") continue;

    const meta = (z.metadata ?? {}) as any;
    const createdAt = meta?.timestamp;
    const author = meta?.author ?? meta?.model;
    const temperature = meta?.temperature;

    const parts = (z.parts ?? []) as any[];

    // assistant: merge all reasoning parts into ONE message, positioned where the first reasoning part occurs
    if (z.role === "assistant") {
      const reasoningParts: any[] = [];
      const toolParts: any[] = [];
      let reasoningInsertAt: number | null = null;
      let toolInsertAt: number | null = null;

      for (let i = 0; i < parts.length; i++) {

        const p = parts[i];
        const t = p?.type;
        if (t === "step-start") continue;

        const isText = t === "text";
        const isReasoning = t === "reasoning";
        const isTool = t.startsWith("tool-");

        if (isReasoning) {
          if (reasoningInsertAt === null) reasoningInsertAt = out.length;
          reasoningParts.push(p);
          continue;
        }

        if (isTool) {
          if (toolInsertAt === null) toolInsertAt = out.length;
          toolParts.push(p);
          continue;
        }

        if (isText) {
          out.push({
            id: `${z.id}:text:${i}`,
            role: z.role,
            content: [p],
            createdAt,
            author,
            temperature
          });
          continue;
        }

        // all other part types become their own message (keeps exact ordering)
        out.push({
          id: `${z.id}:part:${i}`,
          role: z.role,
          content: [p],
          createdAt,
          author,
        });
      }

      if (reasoningParts.length > 0) {
        const reasoningMsg: ChatMessage = {
          id: `${z.id}:reasoning`,
          role: z.role,
          content: reasoningParts,
          messageIcon: "brain",
          messageLabel: translations?.reasoning ?? "reasoning",
          createdAt,
          author,
          temperature
        };
        out.splice(reasoningInsertAt ?? out.length, 0, reasoningMsg);
      }

      if (toolParts.length > 0) {
        const toolMsg: ChatMessage = {
          id: `${z.id}:tools`,
          role: z.role,
          content: toolParts,
          messageIcon: "tool",
          messageLabel: translations?.tools ?? "tools",
          createdAt,
          author,
          temperature
        };

        out.splice(toolInsertAt ?? out.length, 0, toolMsg);
      }

      continue;
    }

    // non-assistant: split text parts; keep everything else as single-part messages
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      const t = p?.type;

      out.push({
        id: `${z.id}:${t === "text" ? "text" : "part"}:${i}`,
        role: z.role,
        content: [p],
        createdAt,
        author,
      });
    }
  }

  return out;
}
