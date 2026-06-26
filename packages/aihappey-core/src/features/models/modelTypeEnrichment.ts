import type { ModelOption } from "aihappey-types";

export const guessModelType = (model?: string) => {
  const modelId = String(model ?? "").toLowerCase();

  if (
    modelId.includes("whisper") ||
    modelId.includes("transcribe") ||
    modelId.includes("cartesia") ||
    (modelId.includes("voxtral") && !modelId.includes("tts"))
  ) {
    return "transcription";
  }

  if (
    modelId.includes("tts") ||
    modelId.includes("canopy") ||
    modelId.includes("kokoro") ||
    modelId.includes("chatterbox")
  ) {
    return "speech";
  }

  if (modelId.includes("rerank")) {
    return "reranking";
  }

  if (modelId.includes("embed")) {
    return "embedding";
  }

  if (
    modelId.includes("image") ||
    modelId.includes("flux") ||
    modelId.includes("stable-diffusion") ||
    modelId.includes("sdxl") ||
    modelId.includes("sd3.5") ||
    modelId.includes("dalle") ||
    modelId.includes("ideogram") ||
    modelId.includes("riverflow") ||
    modelId.includes("kandinsky") ||
    modelId.includes("datacte/proteus") ||
    modelId.includes("dreamshaper") ||
    modelId.includes("bria") ||
    modelId.includes("seedream") ||
    modelId.includes("recraft") ||
    modelId.includes("imagen") ||
    modelId.includes("dall-e")
  ) {
    return "image";
  }

  if (
    modelId.includes("openai/sora-") ||
    modelId.includes("veo-") ||
    modelId.includes("t2v") ||
    modelId.includes("i2v") ||
    modelId.includes("video")
  ) {
    return "video";
  }

  if (modelId.includes("realtime")) {
    return "audio";
  }

  return "language";
};

export const enrichModelType = (model: ModelOption): ModelOption => {
  const type = typeof model.type === "string" ? model.type.trim() : "";
  if (type.length > 0) return model;

  return {
    ...model,
    type: guessModelType(model.id),
  };
};

export const enrichModelTypes = (models: ModelOption[]) => models.map(enrichModelType);
