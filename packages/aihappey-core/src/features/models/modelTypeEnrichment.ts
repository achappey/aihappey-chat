import type { ModelOption } from "aihappey-types";

const MODEL_TYPES = [
  "language",
  "transcription",
  "speech",
  "reranking",
  "embedding",
  "image",
  "video",
  "audio",
] as const;

type ModelType = (typeof MODEL_TYPES)[number];

const isValidModelType = (value?: unknown): value is ModelType => {
  if (typeof value !== "string") return false;
  return MODEL_TYPES.includes(value.trim().toLowerCase() as ModelType);
};

export const guessModelType = (model?: string): ModelType => {
  const modelId = String(model ?? "").trim().toLowerCase();

  // If the input is already a valid model type, return it directly.
  if (isValidModelType(modelId)) {
    return modelId as ModelType;
  }

  if (
    modelId.includes("whisper") ||
    modelId.includes("transcribe") ||
    modelId.includes("transcription") ||
    modelId.includes("cartesia") ||
    (modelId.includes("voxtral") && !modelId.includes("tts"))
  ) {
    return "transcription";
  }

  if (
    modelId.includes("tts") ||
    modelId.includes("speech") ||
    modelId.includes("canopy") ||
    modelId.includes("kokoro") ||
    modelId.includes("chatterbox")
  ) {
    return "speech";
  }

  if (modelId.includes("rerank")) {
    return "reranking";
  }

  if (
    modelId.includes("embed") ||
    modelId.includes("embedding")
  ) {
    return "embedding";
  }

  if (
    modelId.includes("image") ||
    modelId.includes("flux") ||
    modelId.includes("stable-diffusion") ||
    modelId.includes("sdxl") ||
    modelId.includes("sd3.5") ||
    modelId.includes("dalle") ||
    modelId.includes("dall-e") ||
    modelId.includes("ideogram") ||
    modelId.includes("riverflow") ||
    modelId.includes("kandinsky") ||
    modelId.includes("datacte/proteus") ||
    modelId.includes("dreamshaper") ||
    modelId.includes("bria") ||
    modelId.includes("seedream") ||
    modelId.includes("recraft") ||
    modelId.includes("imagen")
  ) {
    return "image";
  }

  if (
    modelId.includes("openai/sora-") ||
    modelId.includes("sora") ||
    modelId.includes("veo-") ||
    modelId.includes("t2v") ||
    modelId.includes("i2v") ||
    modelId.includes("video")
  ) {
    return "video";
  }

  if (
    modelId.includes("realtime") ||
    modelId.includes("audio")
  ) {
    return "audio";
  }

  return "language";
};

export const enrichModelType = (model: ModelOption): ModelOption => {
  const existingType = typeof model.type === "string"
    ? model.type.trim().toLowerCase()
    : "";

  // Only trust existing type if it is valid.
  if (isValidModelType(existingType)) {
    return model;
  }

  return {
    ...model,
    type: guessModelType(model.id),
  };
};

export const enrichModelTypes = (models: ModelOption[]): ModelOption[] =>
  models.map(enrichModelType);