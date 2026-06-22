import type { ImageContent } from "@modelcontextprotocol/sdk/types";

const imageExtensionsByMimeType: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/bmp": "bmp",
  "image/avif": "avif",
};

export const getImageContentMimeType = (image: ImageContent) => {
  const data = image.data ?? "";

  if (data.startsWith("data:")) {
    const mimeTypeEnd = data.indexOf(";");
    if (mimeTypeEnd > 5) return data.substring(5, mimeTypeEnd);
  }

  return image.mimeType ?? "image/png";
};

export const getImageFileExtension = (mimeType: string) =>
  imageExtensionsByMimeType[mimeType] ?? "bin";

export const imageContentToSrc = (image: ImageContent | string | undefined) => {
  if (!image) return "";

  if (typeof image === "string") return image;

  const data = image.data ?? "";
  if (data.startsWith("data:")) return data;

  return `data:${getImageContentMimeType(image)};base64,${data}`;
};

export const downloadImageContent = async (image: ImageContent) => {
  const mimeType = getImageContentMimeType(image);
  const src = imageContentToSrc(image);
  const res = await fetch(src);
  const blob = await res.blob();
  const ext = getImageFileExtension(mimeType);

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `image.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => URL.revokeObjectURL(url), 2000);
};
