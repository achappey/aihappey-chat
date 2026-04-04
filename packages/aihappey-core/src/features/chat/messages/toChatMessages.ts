import { ChatMessage, SYSTEM_ROLE } from "aihappey-types";
import type { FileUIPart, ToolUIPart, UIMessage, UIMessagePart } from "aihappey-ai";
import { CallToolResult } from "aihappey-mcp";

function isCallToolResult(output: unknown): output is CallToolResult {
  return (
    typeof output === "object" &&
    output !== null &&
    Array.isArray((output as any).content)
  );
}

export function toChatMessages(
  messages: UIMessage[],
): ChatMessage[] {
  const toolPartCounts = new Map<string, number>();
  const out: ChatMessage[] = [];

  for (let zi = 0; zi < messages.length; zi++) {
    const z = messages[zi];
    if (z.role === SYSTEM_ROLE) continue;
    const rawId = (z as any).id ?? (z as any).messageId;
    const baseId =
      typeof rawId === "string" || typeof rawId === "number"
        ? String(rawId)
        : `${z.role}:${zi}`;

    const meta = (z.metadata ?? {}) as any;
    const createdAtRaw = meta?.timestamp;
    const author = meta?.author ?? meta?.model;
    const temperature = meta?.temperature;
    const totalTokens = meta?.totalTokens;
    const costRaw = meta?.gateway?.cost ?? meta?.cost;
    const cost =
      typeof costRaw === "number"
        ? costRaw
        : typeof costRaw === "string" && costRaw.trim().length > 0
          ? Number(costRaw)
          : undefined;
    const parts = ((z.parts ?? [])).filter((p) => p?.type !== "step-start");

    const nonImageFiles = parts.filter(
      (p): p is FileUIPart =>
        p?.type === "file" && !p?.mediaType?.startsWith("image/")
    );

    const sources = parts.filter(
      (p) => p?.type === "source-url" || p?.type === "source-document"
    );

    const baseTime = createdAtRaw ? Date.parse(createdAtRaw) : Date.now();
    const ts = (offsetMs: number) => new Date(baseTime + offsetMs).toISOString();

    // --- Buffers ---
    let activityRun: UIMessagePart<any, any>[] = [];
    let activityRunStartIndex: number | null = null;

    let imageRun: FileUIPart[] = [];
    let imageRunStartIndex: number | null = null;

    const flushActivity = () => {
      if (!activityRun.length) return;

      const firstToolPart = activityRun.find(
        (p: any) => typeof p?.type === "string" && p.type.startsWith("tool-") && p.toolCallId
      ) as any;
      const activityKey = (() => {
        if (!firstToolPart?.toolCallId) {
          return `${baseId}:activity:${activityRunStartIndex ?? 0}`;
        }
        const base = `${baseId}:activity:${firstToolPart.toolCallId}`;
        const nextCount = (toolPartCounts.get(base) ?? 0) + 1;
        toolPartCounts.set(base, nextCount);
        return `${base}:${nextCount}`;
      })();

      out.push({
        id: activityKey,
        role: z.role,
        content: activityRun,
        createdAt: ts(activityRunStartIndex ?? 0),
        author,
        temperature,
        totalTokens,
        cost,
      } as any);

      activityRun = [];
      activityRunStartIndex = null;
    };

    const flushImages = () => {
      if (!imageRun.length) return;

      out.push({
        id: `${baseId}:images:${imageRunStartIndex ?? 0}`,
        role: z.role,
        content: [
          {
            type: "image-grid",
            items: imageRun,
          } as any,
        ],
        createdAt: ts(imageRunStartIndex ?? 0),
        author,
        temperature,
        totalTokens,
        cost,
      } as any);

      imageRun = [];
      imageRunStartIndex = null;
    };

    const startImageRunIfNeeded = (i: number) => {
      if (imageRunStartIndex === null) imageRunStartIndex = i;
    };

    const startActivityRunIfNeeded = (i: number) => {
      if (activityRunStartIndex === null) activityRunStartIndex = i;
    };

    // --- Iterate parts, preserving exact order via flushes ---
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      const t = p?.type;

      // 1) Images: buffer consecutive image files
      if (t === "file" && (p as FileUIPart)?.mediaType?.startsWith("image/")) {
        startImageRunIfNeeded(i);
        imageRun.push(p as FileUIPart);
        continue;
      }

      // Any non-image part breaks the image run
      // flushImages();

      // 2) Text: flush activity, then push text message
      if (t === "text") {
        flushActivity();

        out.push({
          id: `${baseId}:text:${i}`,
          role: z.role,
          content: [p as any],
          attachments: nonImageFiles,
          sources,
          createdAt: ts(i),
          author,
          temperature,
          totalTokens,
          cost,
        } as any);

        continue;
      }

      const part = p as ToolUIPart;

      if (
        typeof t === "string" &&
        t.startsWith("tool-") &&
        isCallToolResult(part.output)
      ) {
        part.output.content.filter(a => a.type == "image").forEach((item) => {
          imageRun.push({
            type: "file",
            mediaType: item.mimeType,
            url: item.data
          });
          // item is correctly typed from CallToolResult["content"]
        });
      }


      // 3) Special tool widget block: flush activity, then push widget message
      if (
        typeof t === "string" &&
        t.startsWith("tool-") &&
        ((p as ToolUIPart).output as any)?._meta?.["chat/html"]
      ) {
        flushActivity();

        out.push({
          id: `${baseId}:widget:${i}:${(p as any)?.toolCallId ?? ""}`,
          role: z.role,
          content: [p as any],
          createdAt: ts(i),
          author,
          temperature,
          totalTokens,
          cost,
        } as any);

        continue;
      }

      // 4) Ignore files/sources as "activity" (files become attachments, sources become sources)
      if (t === "file" || t === "source-url" || t === "source-document") {
        continue;
      }

      // 5) Everything else becomes "activity" and stays grouped
      startActivityRunIfNeeded(i);
      activityRun.push(p as any);
    }

    // Flush any trailing buffers
    flushActivity();
    flushImages();
  }

  return out;
}
