import { store as appStore, useAppStore } from "aihappey-state";
import { useEffect, useState } from "react";

export function useDefaultModel(authenticated: boolean) {
  const userPreferredModel = useAppStore((s) => s.userPreferredModel);
  const setUserPreferredModel = useAppStore((s) => s.setUserPreferredModel);
  const [storeHydrated, setStoreHydrated] = useState(() =>
    (appStore as any).persist?.hasHydrated?.() ?? true,
  );

  useEffect(() => {
    const persistApi = (appStore as any).persist;
    if (!persistApi || persistApi.hasHydrated?.()) {
      setStoreHydrated(true);
      return;
    }

    return persistApi.onFinishHydration?.(() => setStoreHydrated(true));
  }, []);

  useEffect(() => {
    if (!storeHydrated) return;
    if (userPreferredModel) return;

    const defaultModel = authenticated ? "openai/gpt-5.4-mini" : "pollinations/openai"
    setUserPreferredModel(defaultModel)
  }, [authenticated, setUserPreferredModel, storeHydrated, userPreferredModel]);
}
