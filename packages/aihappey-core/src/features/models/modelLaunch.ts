import type { IconToken, ModelOption } from "aihappey-types";

type ModelLaunchConfig = {
  icon: IconToken;
  path: string;
};

const MODEL_LAUNCH_BY_TYPE: Partial<Record<string, ModelLaunchConfig>> = {
  language: { icon: "chat", path: "/" },
  video: { icon: "video", path: "/videos" },
  speech: { icon: "speech", path: "/speech" },
  transcription: { icon: "transcription", path: "/transcriptions" },
  reranking: { icon: "reranking", path: "/reranking" },
  image: { icon: "image", path: "/images" },
};

export const getModelLaunchConfig = (modelType?: string) =>
  modelType ? MODEL_LAUNCH_BY_TYPE[modelType] : undefined;

export const getModelLaunchPath = (model: Pick<ModelOption, "id" | "type">) => {
  const config = getModelLaunchConfig(model.type);
  if (!config) return undefined;

  return `${config.path}?model=${encodeURIComponent(model.id)}`;
};

