import type { FileUIPart, UIMessage } from "aihappey-ai";

export type ActivityAttachment = FileUIPart & { size?: number };

export function collectActivityAttachments(messages: UIMessage[] = []) {
  const groups = {
    input: new Map<string, ActivityAttachment>(),
    output: new Map<string, ActivityAttachment>(),
  };

  for (const message of messages) {
    if (message.role === "system") continue;
    const group = message.role === "user" ? groups.input : groups.output;
    const generated = new Map<string, ActivityAttachment>();
    const add = (value: any) => {
      if (typeof value?.url !== "string" || !value.url.trim()) return;
      const mediaType = value.mediaType || "application/octet-stream";
      const url = /^[A-Za-z][A-Za-z\d+.-]*:/.test(value.url)
        ? value.url
        : `data:${mediaType};base64,${value.url}`;
      const metadata = Object.values(value.providerMetadata ?? {}) as any[];
      const file: ActivityAttachment = {
        ...value,
        type: "file",
        mediaType,
        url,
        filename: value.filename || metadata.find(m => typeof m?.filename === "string")?.filename,
        size: typeof value.size === "number" && Number.isFinite(value.size) && value.size >= 0
          ? value.size : undefined,
      };
      const generatedId = metadata.find(m => m?.generated_image_id || m?.generatedImageId);
      const id = generatedId?.generated_image_id ?? generatedId?.generatedImageId;
      if (typeof id === "string") {
        generated.set(id, file);
        return;
      }
      const key = JSON.stringify([mediaType, url]);
      const previous = group.get(key);
      group.set(key, {
        ...previous,
        ...file,
        filename: file.filename || previous?.filename,
        size: file.size ?? previous?.size,
      });
    };

    for (const part of message.parts ?? []) {
      const value = part as any;
      if (value.type === "file") add(value);
      if (value.type?.startsWith("tool-") || value.type === "dynamic-tool") {
        const content = value.output?.content;
        for (const item of Array.isArray(content) ? content : content ? [content] : []) {
          if (item?.type === "image" || item?.type === "audio") {
            if (typeof item.data === "string") {
              add({ mediaType: item.mimeType, url: item.data, filename: item.name, size: item.size });
            }
          } else if (item?.type === "resource" || item?.type === "resource_link") {
            const resource = item.type === "resource" ? item.resource : item;
            if (!resource) continue;
            const mediaType = resource.mimeType || "application/octet-stream";
            const url = typeof resource.blob === "string"
              ? `data:${mediaType};base64,${resource.blob}`
              : typeof resource.text === "string"
                ? `data:${mediaType},${encodeURIComponent(resource.text)}`
                : resource.uri;
            let filename = resource.name;
            if (!filename && typeof resource.uri === "string") {
              try {
                filename = decodeURIComponent(new URL(resource.uri).pathname.split("/").filter(Boolean).pop() ?? "");
              } catch { /* A resource URI need not be a browser URL. */ }
            }
            add({
              mediaType, url, filename,
              size: resource.size ?? item.size
                ?? (typeof resource.text === "string" ? new TextEncoder().encode(resource.text).length : undefined),
            });
          } else if (item?.type === "file") {
            add(item);
          }
        }
      }
    }
    for (const file of generated.values()) {
      group.set(JSON.stringify([file.mediaType, file.url]), file);
    }
  }

  return { input: [...groups.input.values()], output: [...groups.output.values()] };
}
