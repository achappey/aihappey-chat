import React, { useEffect, useState } from "react";
import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { MODEL_PREFERENCE_FIELDS, store as appStore, useAppStore, type DefaultModelsByType } from "aihappey-state";
import { getModelTypeLabelKey } from "aihappey-types";
import { useChatContext } from "../../features/chat/context/ChatContext";
import { getDefaultModelUpdates } from "./defaultModelUpdates";

// Deliberately not persisted: survive route/shell remounts, but reset on the next page load.
let dismissedForAppLaunch = false;

export const DefaultModelUpdatesWarning = () => {
  const { config } = useChatContext();
  const { Alert, Button } = useTheme();
  const { t } = useTranslation();
  const models = useAppStore(s => s.models);
  const modelsLoaded = useAppStore(s => s.modelsLoaded);
  const progress = useAppStore(s => s.modelsLoadingProgress);
  const language = useAppStore(s => s.userPreferredModel);
  const image = useAppStore(s => s.userPreferredImageModel);
  const video = useAppStore(s => s.userPreferredVideoModel);
  const speech = useAppStore(s => s.userPreferredSpeechModel);
  const [dismissed, setDismissed] = useState(() => dismissedForAppLaunch);
  const [saveFailed, setSaveFailed] = useState(false);
  const [hydrated, setHydrated] = useState(() => appStore.persist.hasHydrated());

  useEffect(() => {
    const unsubscribe = appStore.persist.onFinishHydration(() => setHydrated(true));
    if (appStore.persist.hasHydrated()) setHydrated(true);
    return unsubscribe;
  }, []);

  const updates = hydrated && modelsLoaded && !progress?.active
    ? getDefaultModelUpdates({ userPreferredModel: language, userPreferredImageModel: image,
      userPreferredVideoModel: video, userPreferredSpeechModel: speech }, config.defaultModelsByType, models ?? [])
    : {};
  const types = Object.keys(updates) as (keyof DefaultModelsByType)[];
  if (dismissed || !types.length) return null;

  const dismiss = () => { dismissedForAppLaunch = true; setDismissed(true); };
  const apply = () => {
    const current = appStore.getState();
    if (!appStore.persist.hasHydrated() || !current.modelsLoaded || current.modelsLoadingProgress?.active) return;
    const latest = getDefaultModelUpdates(current, config.defaultModelsByType, current.models ?? []);
    const patch: Partial<typeof current> = {};
    const previous: Partial<typeof current> = {};
    for (const type of Object.keys(latest) as (keyof DefaultModelsByType)[]) {
      const field = MODEL_PREFERENCE_FIELDS[type];
      patch[field] = latest[type];
      previous[field] = current[field];
    }
    if (!Object.keys(patch).length) return;
    try {
      appStore.setState(patch);
      dismiss();
    } catch {
      // Zustand publishes before synchronous storage writes. Restore only the changed fields.
      try { appStore.setState(previous); } catch { /* The in-memory rollback still took effect. */ }
      setSaveFailed(true);
    }
  };

  return <div style={{ flexShrink: 0 }}>
    <Alert variant="warning">
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <span>{t("defaultModelUpdates.message", { types: types.map(type => t(getModelTypeLabelKey(type))).join(", ") })}</span>
        <Button onClick={apply}>{t("defaultModelUpdates.apply")}</Button>
        <Button onClick={dismiss} aria-label={t("defaultModelUpdates.dismiss")}>{t("defaultModelUpdates.dismiss")}</Button>
      </div>
      {saveFailed && <div role="alert">{t("defaultModelUpdates.saveFailed")}</div>}
    </Alert>
  </div>;
};
