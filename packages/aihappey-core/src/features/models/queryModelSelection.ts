import { useMemo } from "react";
import { useLocation } from "react-router";
import { type ModelOption } from "aihappey-types";

const getModelQueryValue = (search: string) => {
  try {
    const modelId = new URLSearchParams(search).get("model")?.trim();
    return modelId || undefined;
  } catch {
    return undefined;
  }
};

const resolveQueryModelId = (
  models: ModelOption[],
  modelType: string,
  search: string,
) => {
  const queryModelId = getModelQueryValue(search);
  if (!queryModelId) return undefined;

  const queryModel = models.find((model) =>
    model.id === queryModelId &&
    model.type === modelType
  );

  return queryModel?.id;
};

export const useQueryModelId = (models: ModelOption[] | undefined, modelType: string) => {
  const { search } = useLocation();

  return useMemo(
    () => resolveQueryModelId(models ?? [], modelType, search),
    [models, modelType, search],
  );
};

