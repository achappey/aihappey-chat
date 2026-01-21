import React, { useMemo, useState } from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

/**
 * UI config bucket for speech provider metadata: `providerSpeechMetadata.murfai`.
 *
 * IMPORTANT: keys must match backend JSON property names.
 * Mirrors `MurfAISpeechProviderMetadata`.
 */
export type MurfAISpeechConfig = {
  /** Required by Murf. */
  voiceId?: string;

  /** Duration (seconds) for generated audio; 0 ignored by Murf. Gen2 only. */
  audioDuration?: number;

  /** STEREO | MONO */
  channelType?: string;

  /** When true Murf returns encodedAudio base64 instead of a URL. */
  encodeAsBase64?: boolean;

  /** MP3 | WAV | FLAC | ALAW | ULAW | PCM | OGG */
  format?: string;

  /** GEN2 */
  modelVersion?: string;

  /** IETF language tag like en-US (Gen2 multi-native). */
  multiNativeLocale?: string;

  /** -50..50 */
  pitch?: number;

  /** -50..50 */
  rate?: number;

  /** 8000 | 24000 | 44100 | 48000 */
  sampleRate?: number;

  /** Optional voice style string. */
  style?: string;

  /** 0..5 (Gen2 only) */
  variation?: number;

  /** English only. */
  wordDurationsAsOriginalText?: boolean;

  pronunciationDictionary?: Record<
    string,
    {
      pronunciation?: string;
      type?: "IPA" | "SAY_AS" | string;
    }
  >;
};

const DEFAULT_VALUE = "__default__";

const normalizeKey = (s: string): string => (s ?? "").trim().replace(/\s+/g, " ");

const isFiniteNumber = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n);

const clampInt = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

type PronunciationType = "IPA" | "SAY_AS";

export const MurfAISpeechConfigForm: React.FC<{
  config: MurfAISpeechConfig;
  updateConfig: (val: MurfAISpeechConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const formatOptions = useMemo(
    () => [
      { value: DEFAULT_VALUE, label: t("providerDefault") },
      ...(["MP3", "WAV", "FLAC", "ALAW", "ULAW", "PCM", "OGG"] as const).map(
        (v) => ({ value: v, label: v })
      ),
    ],
    [t]
  );

  const channelOptions = useMemo(
    () => [
      { value: DEFAULT_VALUE, label: t("providerDefault") },
      { value: "MONO", label: "MONO" },
      { value: "STEREO", label: "STEREO" },
    ],
    [t]
  );

  const modelVersionOptions = useMemo(
    () => [
      { value: DEFAULT_VALUE, label: t("providerDefault") },
      { value: "GEN2", label: "GEN2" },
    ],
    [t]
  );

  const sampleRateOptions = useMemo(
    () => [
      { value: DEFAULT_VALUE, label: t("providerDefault") },
      ...([8000, 24000, 44100, 48000] as const).map((v) => ({
        value: String(v),
        label: String(v),
      })),
    ],
    [t]
  );

  const pronunciationTypeOptions = useMemo(
    () => [
      { value: DEFAULT_VALUE, label: t("providerDefault") },
      { value: "IPA", label: "IPA" },
      { value: "SAY_AS", label: "SAY_AS" },
    ],
    [t]
  );

  const existingEntries = useMemo(() => {
    const dict = config?.pronunciationDictionary;
    if (!dict) return [] as Array<{ key: string; entry: any }>;
    return Object.entries(dict)
      .map(([k, v]) => ({ key: k, entry: v }))
      .filter((x) => normalizeKey(x.key).length > 0);
  }, [config?.pronunciationDictionary]);

  const [newTerm, setNewTerm] = useState<string>("");
  const [newType, setNewType] = useState<PronunciationType>("SAY_AS");
  const [newPronunciation, setNewPronunciation] = useState<string>("");

  const upsertPronunciationEntry = (
    term: string,
    next: Partial<NonNullable<MurfAISpeechConfig["pronunciationDictionary"]>[string]>
  ) => {
    const dict = { ...(config?.pronunciationDictionary ?? {}) };
    const normalizedTerm = normalizeKey(term);
    if (!normalizedTerm) return;

    // Case-insensitive de-dupe: replace the first matching key.
    const existingKey = Object.keys(dict).find(
      (k) => normalizeKey(k).toLowerCase() === normalizedTerm.toLowerCase()
    );

    const effectiveKey = existingKey ?? normalizedTerm;
    const merged = {
      ...(dict[effectiveKey] ?? {}),
      ...next,
    };

    const hasAny = Object.values(merged).some((v) => v !== undefined && String(v).length > 0);
    if (!hasAny) {
      delete dict[effectiveKey];
    } else {
      dict[effectiveKey] = merged;
    }

    updateConfig({
      ...config,
      pronunciationDictionary: Object.keys(dict).length ? dict : undefined,
    });
  };

  const removePronunciationEntry = (term: string) => {
    const dict = { ...(config?.pronunciationDictionary ?? {}) };
    const key = Object.keys(dict).find(
      (k) => normalizeKey(k).toLowerCase() === normalizeKey(term).toLowerCase()
    );
    if (!key) return;
    delete dict[key];
    updateConfig({
      ...config,
      pronunciationDictionary: Object.keys(dict).length ? dict : undefined,
    });
  };

  const addNewPronunciationEntry = () => {
    const term = normalizeKey(newTerm);
    if (!term) return;
    const pronunciation = normalizeKey(newPronunciation);
    if (!pronunciation) return;

    upsertPronunciationEntry(term, { type: newType, pronunciation });
    setNewTerm("");
    setNewPronunciation("");
    setNewType("SAY_AS");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("general")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Input
            id="murfai-speech-voice-id"
            required
            label={t("speechSettings.voice")}
            hint="Use Murf voiceId (e.g. en-US-natalie) or actor name (e.g. natalie)."
            placeholder="ex. en-US-natalie"
            value={config?.voiceId ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateConfig({ ...config, voiceId: raw.length ? raw : undefined });
            }}
          />

          <theme.Select
            label={t("outputFormat")}
            values={[config?.format ?? DEFAULT_VALUE]}
            valueTitle={
              formatOptions.find((o) => o.value === (config?.format ?? DEFAULT_VALUE))
                ?.label
            }
            options={formatOptions}
            onChange={(val: string) => {
              const raw = String(val ?? "");
              updateConfig({
                ...config,
                format: raw === DEFAULT_VALUE ? undefined : raw,
              });
            }}
            style={{ minWidth: 220 }}
          >
            {formatOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>

          <theme.Select
            label="Channel"
            values={[config?.channelType ?? DEFAULT_VALUE]}
            valueTitle={
              channelOptions.find(
                (o) => o.value === (config?.channelType ?? DEFAULT_VALUE)
              )?.label
            }
            options={channelOptions}
            onChange={(val: string) => {
              const raw = String(val ?? "");
              updateConfig({
                ...config,
                channelType: raw === DEFAULT_VALUE ? undefined : raw,
              });
            }}
            style={{ minWidth: 220 }}
          >
            {channelOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>

          <theme.Select
            label="Model version"
            values={[config?.modelVersion ?? DEFAULT_VALUE]}
            valueTitle={
              modelVersionOptions.find(
                (o) => o.value === (config?.modelVersion ?? DEFAULT_VALUE)
              )?.label
            }
            options={modelVersionOptions}
            onChange={(val: string) => {
              const raw = String(val ?? "");
              updateConfig({
                ...config,
                modelVersion: raw === DEFAULT_VALUE ? undefined : raw,
              });
            }}
            style={{ minWidth: 220 }}
          >
            {modelVersionOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>
        </div>
      </theme.Card>

      <theme.Card size="small" title="Audio">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Select
            label={t("speechSettings.sampleRate")}
            values={[isFiniteNumber(config?.sampleRate) ? String(config.sampleRate) : DEFAULT_VALUE]}
            valueTitle={
              sampleRateOptions.find(
                (o) =>
                  o.value ===
                  (isFiniteNumber(config?.sampleRate)
                    ? String(config.sampleRate)
                    : DEFAULT_VALUE)
              )?.label
            }
            options={sampleRateOptions}
            onChange={(val: string) => {
              const raw = String(val ?? "");
              if (raw === DEFAULT_VALUE) {
                updateConfig({ ...config, sampleRate: undefined });
                return;
              }
              const next = Number(raw);
              if (!Number.isFinite(next)) return;
              updateConfig({ ...config, sampleRate: next });
            }}
            style={{ minWidth: 220 }}
          >
            {sampleRateOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>

          <theme.Input
            id="murfai-speech-audio-duration"
            type="number"
            step={0.1}
            min={0}
            label="Audio duration (seconds)"
            hint="Optional. If set to 0, Murf ignores it. Gen2 only."
            value={config?.audioDuration ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateConfig({
                ...config,
                audioDuration: raw.length ? Number(raw) : undefined,
              });
            }}
          />

          <theme.Switch
            id="murfai-speech-encode-base64"
            label="Encode as Base64"
            checked={config?.encodeAsBase64 ?? false}
            onChange={(enabled) => updateConfig({ ...config, encodeAsBase64: enabled })}
          />
        </div>
      </theme.Card>

      <theme.Card size="small" title="Voice">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Input
            id="murfai-speech-locale"
            label="Multi-native locale"
            hint="Optional. IETF language tag like en-US. Gen2 only."
            placeholder="ex. en-US"
            value={config?.multiNativeLocale ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateConfig({
                ...config,
                multiNativeLocale: raw.length ? raw : undefined,
              });
            }}
          />

          <theme.Input
            id="murfai-speech-style"
            label="Style"
            hint="Optional voice style to be used for generation."
            placeholder="ex. Conversational"
            value={config?.style ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateConfig({ ...config, style: raw.length ? raw : undefined });
            }}
          />

          <theme.Slider
            label={`Pitch (${config?.pitch ?? 0})`}
            min={-50}
            max={50}
            step={1}
            value={config?.pitch ?? 0}
            onChange={(value: number) =>
              updateConfig({
                ...config,
                pitch: clampInt(value, -50, 50),
              })
            }
          />

          <theme.Slider
            label={`Rate (${config?.rate ?? 0})`}
            min={-50}
            max={50}
            step={1}
            value={config?.rate ?? 0}
            onChange={(value: number) =>
              updateConfig({
                ...config,
                rate: clampInt(value, -50, 50),
              })
            }
          />

          <theme.Input
            id="murfai-speech-variation"
            type="number"
            step={1}
            min={0}
            max={5}
            label="Variation"
            hint="Optional (0..5). Higher values add more variation. Gen2 only."
            value={config?.variation ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              if (!raw.length) {
                updateConfig({ ...config, variation: undefined });
                return;
              }
              const next = Number(raw);
              if (!Number.isFinite(next)) return;
              updateConfig({
                ...config,
                variation: clampInt(Math.round(next), 0, 5),
              });
            }}
          />
        </div>
      </theme.Card>

      <theme.Card size="small" title="Advanced">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Switch
            id="murfai-speech-word-durations-original"
            label="Word durations as original text"
            checked={config?.wordDurationsAsOriginalText ?? false}
            onChange={(enabled) =>
              updateConfig({ ...config, wordDurationsAsOriginalText: enabled })
            }
          />
        </div>
      </theme.Card>

      <theme.Card size="small" title="Pronunciation dictionary">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 2fr auto", gap: 8, alignItems: "end" }}>
            <theme.Input
              id="murfai-pronunciation-new-term"
              label="Term"
              placeholder="ex. 2022"
              value={newTerm}
              onChange={(e: any) => setNewTerm(e.target.value)}
              onKeyDown={(e: any) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addNewPronunciationEntry();
                }
              }}
            />

            <theme.Select
              label="Type"
              values={[newType]}
              valueTitle={newType}
              options={pronunciationTypeOptions}
              onChange={(val: string) => {
                const raw = String(val ?? "");
                if (raw === DEFAULT_VALUE) return;
                if (raw === "IPA" || raw === "SAY_AS") setNewType(raw);
              }}
              style={{ minWidth: 160 }}
            >
              <option value="IPA">IPA</option>
              <option value="SAY_AS">SAY_AS</option>
            </theme.Select>

            <theme.Input
              id="murfai-pronunciation-new-pronunciation"
              label="Pronunciation"
              placeholder='ex. twenty twenty two'
              value={newPronunciation}
              onChange={(e: any) => setNewPronunciation(e.target.value)}
              onKeyDown={(e: any) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addNewPronunciationEntry();
                }
              }}
            />

            <theme.Button
              icon="add"
              size="small"
              title={t("add")}
              variant="informative"
              disabled={!normalizeKey(newTerm) || !normalizeKey(newPronunciation)}
              onClick={addNewPronunciationEntry}
            />
          </div>

          {existingEntries.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {existingEntries.map(({ key, entry }) => {
                const typeValue =
                  entry?.type === "IPA" || entry?.type === "SAY_AS"
                    ? entry.type
                    : DEFAULT_VALUE;

                return (
                  <div
                    key={key}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr 2fr auto",
                      gap: 8,
                      alignItems: "end",
                      padding: "8px 0",
                      borderBottom: "1px solid rgba(0,0,0,0.06)",
                    }}
                  >
                    <theme.Input
                      id={`murfai-pronunciation-term-${key}`}
                      label="Term"
                      value={key}
                      disabled
                    />

                    <theme.Select
                      label="Type"
                      values={[typeValue]}
                      valueTitle={
                        pronunciationTypeOptions.find((o) => o.value === typeValue)?.label
                      }
                      options={pronunciationTypeOptions}
                      onChange={(val: string) => {
                        const raw = String(val ?? "");
                        upsertPronunciationEntry(key, {
                          type: raw === DEFAULT_VALUE ? undefined : raw,
                        });
                      }}
                      style={{ minWidth: 160 }}
                    >
                      {pronunciationTypeOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </theme.Select>

                    <theme.Input
                      id={`murfai-pronunciation-pron-${key}`}
                      label="Pronunciation"
                      value={entry?.pronunciation ?? ""}
                      onChange={(e: any) => {
                        const raw = String(e?.target?.value ?? "");
                        upsertPronunciationEntry(key, {
                          pronunciation: normalizeKey(raw) ? raw : undefined,
                        });
                      }}
                    />

                    <theme.Button
                      size="small"
                      variant="danger"
                      title={t("delete")}
                      onClick={() => removePronunciationEntry(key)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </theme.Card>
    </div>
  );
};

