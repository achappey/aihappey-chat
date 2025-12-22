import { useMemo } from "react";
import { useAppStore } from "aihappey-state";

export function useActiveProviderMetadata<T extends Record<string, any> = Record<string, any>>() {
  const selectedModel = useAppStore((s) => s.selectedModel);
  const providerMetadata = useAppStore((s) => s.providerMetadata);

  return useMemo<T | undefined>(() => {
    if (!selectedModel || !providerMetadata) return undefined;

    const providerKey = selectedModel.split("/")[0];
    const value = providerMetadata[providerKey];

    if (value === undefined) return undefined;

    return { [providerKey]: value } as T;
  }, [selectedModel, providerMetadata]);
}
