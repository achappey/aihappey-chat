import React, { useMemo, useState } from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type { TagItem } from "aihappey-types";

/**
 * IMPORTANT: keys must match backend JSON property names.
 * Mirrors `DeepgramTranscriptionProviderMetadata`.
 */
export type DeepgramTranscriptionConfig = {
  language?: string;

  punctuate?: boolean;
  smart_format?: boolean;
  paragraphs?: boolean;
  utterances?: boolean;
  diarize?: boolean;
  multichannel?: boolean;

  /** boolean OR list-of-strings. */
  detect_language?: boolean | string[];

  detect_entities?: boolean;
  topics?: boolean;
  intents?: boolean;
  sentiment?: boolean;
  mip_opt_out?: boolean;

  /** string OR list-of-strings. */
  tag?: string | string[];
};

const normalizeListItem = (s: string): string => {
  return (s ?? "").trim().replace(/\s+/g, " ");
};

const normalizeList = (val: unknown): string[] => {
  const raw = Array.isArray(val) ? val : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of raw) {
    const n = normalizeListItem(String(v ?? ""));
    if (!n) continue;
    const key = n.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }
  return out;
};

export const DeepgramTranscriptionConfigForm: React.FC<{
  config: DeepgramTranscriptionConfig;
  updateConfig: (val: DeepgramTranscriptionConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const tagList = useMemo(() => {
    const v = config?.tag;
    return Array.isArray(v) ? normalizeList(v) : [];
  }, [config?.tag]);

  const [newTag, setNewTag] = useState<string>("");
  const tagItems: TagItem[] = tagList.map((x) => ({ key: x, label: x }));

  const addTag = () => {
    const n = normalizeListItem(newTag);
    if (!n) return;
    const next = normalizeList([...tagList, n]);
    updateConfig({
      ...config,
      tag: next.length ? next : undefined,
    });
    setNewTag("");
  };

  const removeTag = (tag: string) => {
    const key = normalizeListItem(tag).toLowerCase();
    const next = tagList.filter((x) => normalizeListItem(x).toLowerCase() !== key);
    updateConfig({
      ...config,
      tag: next.length ? next : undefined,
    });
  };


  // detect_language: switch-only UX.
  // If a previous config stored a list-of-strings, we treat it as "enabled".
  const detectLanguageEnabled = useMemo(() => {
    const v = config?.detect_language;
    if (typeof v === "boolean") return v;
    if (Array.isArray(v)) return v.length > 0;
    return false;
  }, [config?.detect_language]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("general")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Input
            label={t("providers:deepgram.language")}
            placeholder="en, nl"
            value={config?.language ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateConfig({ ...config, language: raw ? raw : undefined });
            }}
          />

          <theme.Switch
            id="deepgram-transcription-detect-language"
            label={t("providers:deepgram.detectLanguage")}
            checked={detectLanguageEnabled}
            onChange={(enabled) =>
              updateConfig({
                ...config,
                detect_language: enabled ? true : undefined,
              })
            }
          />

          <theme.Switch
            id="deepgram-transcription-punctuate"
            label={t("providers:deepgram.punctuate")}
            checked={config?.punctuate ?? false}
            onChange={(enabled) => updateConfig({ ...config, punctuate: enabled })}
          />

          <theme.Switch
            id="deepgram-transcription-smart-format"
            label={t("providers:deepgram.smartFormat")}
            checked={config?.smart_format ?? false}
            onChange={(enabled) => updateConfig({ ...config, smart_format: enabled })}
          />

          <theme.Switch
            id="deepgram-transcription-paragraphs"
            label={t("providers:deepgram.paragraphs")}
            checked={config?.paragraphs ?? false}
            onChange={(enabled) => updateConfig({ ...config, paragraphs: enabled })}
          />

          <theme.Switch
            id="deepgram-transcription-utterances"
            label={t("providers:deepgram.utterances")}
            checked={config?.utterances ?? false}
            onChange={(enabled) => updateConfig({ ...config, utterances: enabled })}
          />

          <theme.Switch
            id="deepgram-transcription-diarize"
            label={t("providers:deepgram.diarize")}
            checked={config?.diarize ?? false}
            onChange={(enabled) => updateConfig({ ...config, diarize: enabled })}
          />

          <theme.Switch
            id="deepgram-transcription-multichannel"
            label={t("providers:deepgram.multichannel")}
            checked={config?.multichannel ?? false}
            onChange={(enabled) => updateConfig({ ...config, multichannel: enabled })}
          />

          <theme.Switch
            id="deepgram-transcription-detect-entities"
            label={t("providers:deepgram.detectEntities")}
            checked={config?.detect_entities ?? false}
            onChange={(enabled) => updateConfig({ ...config, detect_entities: enabled })}
          />

          <theme.Switch
            id="deepgram-transcription-topics"
            label={t("providers:deepgram.topics")}
            checked={config?.topics ?? false}
            onChange={(enabled) => updateConfig({ ...config, topics: enabled })}
          />

          <theme.Switch
            id="deepgram-transcription-intents"
            label={t("providers:deepgram.intents")}
            checked={config?.intents ?? false}
            onChange={(enabled) => updateConfig({ ...config, intents: enabled })}
          />

          <theme.Switch
            id="deepgram-transcription-sentiment"
            label={t("providers:deepgram.sentiment")}
            checked={config?.sentiment ?? false}
            onChange={(enabled) => updateConfig({ ...config, sentiment: enabled })}
          />

          <theme.Switch
            id="deepgram-transcription-mip-opt-out"
            label={t("providers:deepgram.mipOptOut")}
            checked={config?.mip_opt_out ?? false}
            onChange={(enabled) => updateConfig({ ...config, mip_opt_out: enabled })}
          />
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={t("providers:deepgram.tags")}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div>
            <theme.Input
              value={newTag}
              label={t("providers:deepgram.addTag")}
              placeholder={t("providers:deepgram.addTagPlaceholder")}
              onChange={(e: any) => setNewTag(e.target.value)}
              onKeyDown={(e: any) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <theme.Button
              icon="add"
              size="small"
              title={t("add")}
              variant="informative"
              disabled={!normalizeListItem(newTag)}
              onClick={addTag}
            />
          </div>

          {tagItems.length > 0 && (
            <theme.Tags size="small" items={tagItems} onRemove={removeTag} />
          )}
        </div>
      </theme.Card>
    </div>
  );
};

