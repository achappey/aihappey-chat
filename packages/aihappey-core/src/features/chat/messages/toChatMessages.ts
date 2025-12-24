import { ChatMessage, SYSTEM_ROLE } from "aihappey-types";
import type { FileUIPart, ToolUIPart, UIMessage } from "aihappey-ai";

export function toChatMessages(
  messages: UIMessage[],
  translations?: any
): ChatMessage[] {
  const out: ChatMessage[] = [];

  for (const z of messages) {
    if (z.role === SYSTEM_ROLE) continue;

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
    //    messageIcon: "tool", // or "dots" if you have it
       // messageLabel: translations?.activity ?? "activity",
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
          sources: parts?.filter(a => a.type == "source-url" || a.type == "source-document"),
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
      if (t !== "file" && t !== "source-url" && t !== "source-document")
        activityRun.push(p);
    }

    flushActivity();
  }

  return out;
}