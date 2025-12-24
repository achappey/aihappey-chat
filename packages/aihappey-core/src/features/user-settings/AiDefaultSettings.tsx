import React from "react";
import { useAppStore } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";

import { ModelSelect } from "../models/ModelSelect";

export const AiDefaultSettings: React.FC = () => {
  const { t } = useTranslation();

  const models = useAppStore((s) => s.models);
  const selectedModel = useAppStore((s) => s.selectedModel);
  const userPreferredModel = useAppStore((s) => s.userPreferredModel);
  const setUserPreferredModel = useAppStore((s) => s.setUserPreferredModel);

  // If the user has not yet chosen a preferred model, we display the currently
  // selected model as a reasonable default. Only userPreferredModel is updated
  // via this settings panel.
  const value = userPreferredModel ?? selectedModel ?? "";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: "0 32px 32px 32px",
      }}
    >
      <ModelSelect
        models={models ?? []}
        value={value}
        label={t("settingsModal.defaultModel")}
        onChange={setUserPreferredModel}
      />
    </div>
  );
};

