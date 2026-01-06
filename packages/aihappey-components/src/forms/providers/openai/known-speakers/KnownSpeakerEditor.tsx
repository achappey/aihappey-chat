import React from "react";
import { useTheme } from "../../../../theme/ThemeContext";

export const KnownSpeakerEditor: React.FC<{
  draftName: string;
  setDraftName: (val: string) => void;
  onSave: () => void;
  onCancel: () => void;
  t: (key: string, params?: any) => string;
}> = ({ draftName, setDraftName, onSave, onCancel, t }) => {
  const theme = useTheme();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <theme.Input
        label={t("name")}
        value={draftName}
        onChange={(e) => setDraftName(e.target.value)}
        placeholder={t("providers:openai.knownSpeakersNamePlaceholder")}
      />

      <div style={{ display: "flex", gap: 8 }}>
        <theme.Button
          size="small"
          variant="primary"
          icon="check"
          onClick={onSave}
        >
          {t("save")}
        </theme.Button>
        <theme.Button size="small" variant="subtle" onClick={onCancel}>
          {t("cancel")}
        </theme.Button>
      </div>
    </div>
  );
};

