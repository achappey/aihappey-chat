import { store as appStore, useAppStore, MODEL_PREFERENCE_FIELDS, normalizeModelIds, type DefaultModelsByType } from "aihappey-state";
import { useEffect, useState } from "react";

export function useDefaultModel(authenticated: boolean, defaults?: DefaultModelsByType) {
  const userPreferredModel = useAppStore((s) => s.userPreferredModel);
  const image = useAppStore((s) => s.userPreferredImageModel);
  const video = useAppStore((s) => s.userPreferredVideoModel);
  const speech = useAppStore((s) => s.userPreferredSpeechModel);
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
    const current = appStore.getState();
    const patch: Partial<typeof current> = {};
    for (const type of Object.keys(MODEL_PREFERENCE_FIELDS) as (keyof DefaultModelsByType)[]) {
      const field = MODEL_PREFERENCE_FIELDS[type];
      if (current[field] !== undefined) continue;
      const ids = defaults?.[type] ?? (type === "language"
        ? [authenticated ? "openai/gpt-6-luna" : "pollinations/openai"] : undefined);
      if (ids !== undefined) patch[field] = normalizeModelIds(ids);
    }
    if (Object.keys(patch).length) appStore.setState(patch);
  }, [authenticated, defaults, storeHydrated, userPreferredModel, image, video, speech]);
}
