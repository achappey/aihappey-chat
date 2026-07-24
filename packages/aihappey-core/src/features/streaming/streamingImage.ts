import { base64ToUint8Array } from "aihappey-ai";

export type StreamingImageSettings = {
  size: string;
  n: string;
  quality: string;
  outputFormat: "png" | "jpeg" | "webp";
  partialImages: string;
};

export type OpenAIImageStreamEvent = {
  type: string;
  b64_json?: string;
  output_format?: string;
  partial_image_index?: number;
};

export type StreamingImage = {
  data: string;
  outputFormat: string;
};

const mimeTypesByOutputFormat: Record<string, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  webp: "image/webp",
};

export const initialStreamingImageSettings: StreamingImageSettings = {
  size: "",
  n: "1",
  quality: "",
  outputFormat: "png",
  partialImages: "3",
};

export const getStreamingImageMimeType = (outputFormat: string) =>
  mimeTypesByOutputFormat[outputFormat.toLowerCase()] ?? "image/png";

export const imageDataUrl = ({ data, outputFormat }: StreamingImage) =>
  `data:${getStreamingImageMimeType(outputFormat)};base64,${data}`;

export const streamingImageBlob = ({ data, outputFormat }: StreamingImage) =>
  new Blob([base64ToUint8Array(data) as BlobPart], { type: getStreamingImageMimeType(outputFormat) });

export const toStreamingImage = (event: OpenAIImageStreamEvent, fallbackOutputFormat: string): StreamingImage | undefined => {
  if (!event.b64_json) return undefined;
  return {
    data: event.b64_json,
    outputFormat: event.output_format || fallbackOutputFormat,
  };
};

export const imageRequestSettings = (settings: StreamingImageSettings) => ({
  size: settings.size || undefined,
  n: settings.n === "" ? undefined : Number(settings.n),
  quality: settings.quality || undefined,
  output_format: settings.outputFormat,
  partial_images: settings.partialImages === "" ? undefined : Number(settings.partialImages),
  stream: true,
});
