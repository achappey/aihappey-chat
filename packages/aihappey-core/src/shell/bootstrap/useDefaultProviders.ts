import { useAppStore } from "aihappey-state";
import { useEffect } from "react";

export function useDefaultProviders(defaultProviders?: string[]) {
  const toggleEnabledProvider = useAppStore((s) => s.toggleEnabledProvider);
  const enabledProviders = useAppStore((s) => s.enabledProviders);

  useEffect(() => {
    if (!enabledProviders.length || enabledProviders.length == 0) {
      if (defaultProviders?.length
        && defaultProviders?.length > 0) {
        for (var prov in defaultProviders) {
          toggleEnabledProvider(defaultProviders[prov])
        }
      }
      else {
        toggleEnabledProvider("Pollinations")
      }
    }
  }, []);
}
