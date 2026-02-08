import {
  createEmptyEnabledProvidersByType,
  useAppStore,
  type ProviderCapability,
} from "aihappey-state";
import { useEffect } from "react";

type DefaultProvidersByType = Partial<Record<ProviderCapability, string[]>>;

export function useDefaultProviders(defaultProvidersByType?: DefaultProvidersByType) {
  const setEnabledProvidersByType = useAppStore((s) => s.setEnabledProvidersByType);
  const enabledProvidersByType = useAppStore((s) => s.enabledProvidersByType);

  useEffect(() => {
    const current = enabledProvidersByType ?? createEmptyEnabledProvidersByType();
    const hasAnyEnabled = Object.values(current).some((list) => (list?.length ?? 0) > 0);
    if (!hasAnyEnabled) {
      setEnabledProvidersByType(defaultProvidersByType ?? {});
    }
  }, [defaultProvidersByType, enabledProvidersByType, setEnabledProvidersByType]);
}
