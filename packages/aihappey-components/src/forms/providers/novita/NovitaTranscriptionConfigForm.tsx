import React, { useMemo, useState } from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type { TagItem } from "aihappey-types";

export type NovitaTranscriptionConfig = {
  /**
   * For long text scenarios, you can provide previous transcription results as context.
   * Recommended to be less than 8000 characters.
   */
  prompt?: string;

  /**
   * Hotword list to improve recognition accuracy for domain-specific vocabulary.
   * Recommended not to exceed 100 items.
   */
  hotwords?: string[];
};

const normalizeHotword = (s: string): string => {
  return (s ?? "").trim().replace(/\s+/g, " ");
};

export const NovitaTranscriptionConfigForm: React.FC<{
  config: NovitaTranscriptionConfig;
  updateConfig: (val: NovitaTranscriptionConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const [newHotword, setNewHotword] = useState<string>("");

  const hotwords = useMemo(() => {
    const raw = Array.isArray(config?.hotwords) ? config.hotwords : [];
    // normalize + de-dupe (case-insensitive) while preserving order
    const seen = new Set<string>();
    const out: string[] = [];
    for (const w of raw) {
      const n = normalizeHotword(w);
      if (!n) continue;
      const key = n.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(n);
    }
    return out;
  }, [config?.hotwords]);

  const hotwordItems: TagItem[] = hotwords.map((w) => ({ key: w, label: w }));

  const maxHotwords = 100;
  const atMax = hotwords.length >= maxHotwords;

  const addHotword = () => {
    const n = normalizeHotword(newHotword);
    if (!n) return;
    if (hotwords.length >= maxHotwords) return;
    const key = n.toLowerCase();
    if (hotwords.some((x) => normalizeHotword(x).toLowerCase() === key)) {
      setNewHotword("");
      return;
    }

    updateConfig({
      ...config,
      hotwords: [...hotwords, n],
    });
    setNewHotword("");
  };

  const removeHotword = (tag: string) => {
    const key = normalizeHotword(tag).toLowerCase();
    const next = hotwords.filter((w) => normalizeHotword(w).toLowerCase() !== key);
    updateConfig({
      ...config,
      hotwords: next.length ? next : undefined,
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("general")}>
        <div>
          <theme.TextArea
            label={t("providers:novita.transcriptionPrompt")}
            placeholder={t("providers:novita.transcriptionPromptPlaceholder")}
            rows={5}
            value={config?.prompt ?? ""}
            onChange={(value) =>
              updateConfig({
                ...config,
                prompt: value,
              })
            }
          />
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={t("providers:novita.hotwords")}
        description={t("providers:novita.hotwordsHint")}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div>
            <theme.Input
              value={newHotword}
              label={t("providers:novita.addHotword")}
              placeholder={t("providers:novita.addHotwordPlaceholder")}
              disabled={atMax}
              onChange={(e: any) => setNewHotword(e.target.value)}
              onKeyDown={(e: any) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addHotword();
                }
              }}
            />
            <theme.Button
              icon="add"
              size="small"
              title={t("add")}
              variant="informative"
              disabled={!normalizeHotword(newHotword) || atMax}
              onClick={addHotword}
            />
          </div>

          {hotwordItems.length > 0 && (
            <theme.Tags size="small" items={hotwordItems} onRemove={removeHotword} />
          )}
        </div>
      </theme.Card>
    </div>
  );
};

