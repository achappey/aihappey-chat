import { parse } from "@molotochok/msg-viewer";
import { extractTextFromFile } from "./file";

export type MsgTextPart = {
  name: string;
  type: "text";
  text: string;
};

export type MsgTextPartsResult = {
  bodyText: string;
  parts: MsgTextPart[];
};

export type MsgConversionLimits = {
  maxDepth: number;
  maxAttachments: number;
  maxAttachmentBytes: number;
};

const defaultLimits: MsgConversionLimits = {
  maxDepth: 2,
  maxAttachments: 50,
  maxAttachmentBytes: 15 * 1024 * 1024,
};

const safeText = (value?: string | null) => (value ?? "").trim();

const buildPreamble = (msg: any) => {
  const subject = safeText(msg?.content?.subject);
  const sender = safeText(
    msg?.content?.senderName || msg?.content?.senderEmail
  );

  const to = safeText(msg?.content?.toRecipients);
  const cc = safeText(msg?.content?.ccRecipients);
  const date = msg?.content?.date
    ? new Date(msg.content.date).toISOString()
    : "";

  const lines: string[] = [];
  if (subject) lines.push(`Subject: ${subject}`);
  if (sender) lines.push(`From: ${sender}`);
  if (to) lines.push(`To: ${to}`);
  if (cc) lines.push(`Cc: ${cc}`);
  if (date) lines.push(`Date: ${date}`);

  return lines.length ? `${lines.join("\n")}\n\n` : "";
};

const extractBodyText = (msg: any) => {
  const body = safeText(msg?.content?.body);
  if (body) return body;

  const html = safeText(msg?.content?.bodyHTML);
  if (!html) return "";

  const div = document.createElement("div");
  div.innerHTML = html;
  return safeText(div.textContent || div.innerText);
};


export const msgToPlainText = async (file: File) => {
  const { bodyText, parts } = await msgFileToTextParts(file);

  let result = [];
  if (bodyText) {
    result.push(bodyText)
  }
  if (parts.length) {
    result.push(...parts.map((part) => part.text));
  }

  return result.join("\n\n")
};

async function msgFileToTextParts(
  file: File,
  options?: Partial<MsgConversionLimits>
): Promise<MsgTextPartsResult> {
  const limits = { ...defaultLimits, ...options };
  const buffer = await file.arrayBuffer();

  const msg = parse(new DataView(buffer));

  const bodyText = `${buildPreamble(msg)}${extractBodyText(msg)}`.trim();
  const parts: MsgTextPart[] = [];

  const attachments = Array.isArray(msg?.attachments) ? msg.attachments : [];
  if (!attachments.length) return { bodyText, parts };

  let processed = 0;

  const traverseAttachments = async (
    currentMsg: any,
    currentAttachments: any[],
    depth: number,
    ownerName: string
  ) => {
    if (depth > limits.maxDepth) return;

    for (const att of currentAttachments) {
      if (processed >= limits.maxAttachments) return;
      processed++;

      const fileName = String(att?.fileName || att?.displayName || "attachment");
      const content = att?.content;
      if (!content) continue;

      const bytes =
        content instanceof Uint8Array
          ? content
          : new Uint8Array(content.buffer ?? content);

      if (bytes.byteLength > limits.maxAttachmentBytes) continue;

      const attachmentFile = new File([bytes], fileName);
      const text = await extractTextFromFile(attachmentFile);

      if (text?.trim()) {
        parts.push({
          name: `${ownerName}/${fileName}`,
          type: "text",
          text: text.trim(),
        });
      }

      // Nested .msg
      if (/\.msg$/i.test(fileName) && depth < limits.maxDepth) {
        try {
          const nestedMsg = parse(
            new DataView(
              bytes.buffer.slice(
                bytes.byteOffset,
                bytes.byteOffset + bytes.byteLength
              )
            )
          );

          const nestedAttachments = Array.isArray(nestedMsg?.attachments)
            ? nestedMsg.attachments
            : [];

          if (nestedAttachments.length) {
            await traverseAttachments(
              nestedMsg,
              nestedAttachments,
              depth + 1,
              fileName
            );
          }
        } catch (error) {
          console.warn(
            "msgFileToTextParts(): failed to parse nested msg",
            error
          );
        }
      }
    }
  };

  await traverseAttachments(msg, attachments, 1, file.name);

  return { bodyText, parts };
}
