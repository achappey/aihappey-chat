import { useMemo } from "react";
import { useAppStore } from "aihappey-state";
import type { Provider } from "aihappey-types";
import { PROVIDERS } from "./providerMetadata";

export const getProviderRegistry = (customProviders?: Record<string, Provider>) => ({
  ...(PROVIDERS as Record<string, Provider>),
  ...(customProviders ?? {}),
});

export const useProviderRegistry = () => {
  const customProviders = useAppStore((s: any) => s.customProviders as Record<string, Provider> | undefined);

  return useMemo(
    () => getProviderRegistry(customProviders),
    [customProviders],
  );
};
