import type { PlaygroundAttachment, PlaygroundEndpointId } from "aihappey-clients";
import { fileToBase64, fileToDataUrl } from "../chat/files/file";

const inferAttachmentKind = (file: File): PlaygroundAttachment["kind"] => {
  const mimeType = String(file.type ?? "").toLowerCase();
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  return "file";
};

const inferAudioFormat = (file: File): PlaygroundAttachment["audioFormat"] => {
  const mimeType = String(file.type ?? "").toLowerCase();
  const name = String(file.name ?? "").toLowerCase();

  if (mimeType.includes("wav") || mimeType.includes("wave") || name.endsWith(".wav")) {
    return "wav";
  }

  if (mimeType.includes("mpeg") || mimeType.includes("mp3") || name.endsWith(".mp3")) {
    return "mp3";
  }

  return undefined;
};

const inferDocumentKind = (file: File): PlaygroundAttachment["documentKind"] => {
  const mimeType = String(file.type ?? "").toLowerCase();
  const name = String(file.name ?? "").toLowerCase();

  if (mimeType === "application/pdf" || name.endsWith(".pdf")) {
    return "pdf";
  }

  if (
    mimeType.startsWith("text/")
    || [
      ".txt",
      ".md",
      ".markdown",
      ".csv",
      ".json",
      ".log",
      ".xml",
      ".yaml",
      ".yml",
      ".html",
      ".htm",
      ".css",
      ".js",
      ".jsx",
      ".ts",
      ".tsx",
    ].some((extension) => name.endsWith(extension))
  ) {
    return "text";
  }

  return undefined;
};

export const encodePlaygroundAttachment = async (file: File): Promise<PlaygroundAttachment> => {
  const kind = inferAttachmentKind(file);
  const id = `${file.name}-${file.size}-${file.lastModified}`;

  if (kind === "image") {
    return {
      id,
      kind,
      filename: file.name,
      mimeType: file.type,
      dataUrl: await fileToDataUrl(file),
    };
  }

  if (kind === "audio") {
    const audioFormat = inferAudioFormat(file);
    return {
      id,
      kind,
      filename: file.name,
      mimeType: file.type,
      base64: await fileToBase64(file),
      audioFormat,
    };
  }

  const documentKind = inferDocumentKind(file);

  return {
    id,
    kind,
    filename: file.name,
    mimeType: file.type,
    dataUrl: await fileToDataUrl(file),
    base64: await fileToBase64(file),
    documentKind,
    textContent: documentKind === "text" ? await file.text() : undefined,
  };
};

export const getPlaygroundUnsupportedAttachmentKinds = (
  endpointId: PlaygroundEndpointId,
  attachments: PlaygroundAttachment[],
): PlaygroundAttachment["kind"][] => {
  const kinds = new Set<PlaygroundAttachment["kind"]>();

  attachments.forEach((attachment) => {
    if (endpointId === "/api/chat") {
      if (attachment.kind === "image") {
        if (!attachment.dataUrl) {
          kinds.add("image");
        }
        return;
      }

      if (attachment.kind === "audio") {
        if (!attachment.base64) {
          kinds.add("audio");
        }
        return;
      }

      if (!attachment.dataUrl && !attachment.base64) {
        kinds.add("file");
      }

      return;
    }

    if (endpointId === "/v1/chat/completions") {
      if (attachment.kind === "audio" && !attachment.audioFormat) {
        kinds.add("audio");
      }
      return;
    }

    if (endpointId === "/v1/responses") {
      if (attachment.kind === "audio") {
        kinds.add("audio");
      }
      return;
    }

    if (endpointId === "/v1/messages") {
      if (attachment.kind === "audio") {
        kinds.add("audio");
        return;
      }

      if (attachment.kind === "file" && !attachment.documentKind) {
        kinds.add("file");
      }

      return;
    }

    if (endpointId === "/sampling") {
      if (attachment.kind === "image") {
        if (!attachment.dataUrl) {
          kinds.add("image");
        }
        return;
      }

      if (attachment.kind === "audio") {
        if (!attachment.base64) {
          kinds.add("audio");
        }
        return;
      }

      if (!attachment.base64 && !attachment.textContent) {
        kinds.add("file");
      }

      return;
    }

    kinds.add(attachment.kind);
  });

  return Array.from(kinds);
};
