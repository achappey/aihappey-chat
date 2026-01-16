import React, { useMemo, useState } from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type { TagItem } from "aihappey-types";

/**
 * IMPORTANT: keys must match backend JSON property names.
 * Mirrors `DeepgramSpeechProviderMetadata`.
 */
export type DeepgramSpeechConfig = {
  /** Output encoding (query param: encoding). */
  encoding?: string;

  /** Output container (query param: container). */
  container?: string;

  /** Output sample rate in Hz (query param: sample_rate). */
  sample_rate?: number;

  /** Bitrate in bits per second (query param: bit_rate). */
  bit_rate?: number;

  /** Opt out of Deepgram MIP (query param: mip_opt_out). */
  mip_opt_out?: boolean;

  /** Usage reporting tag (query param: tag). Deepgram accepts string or list-of-strings. */
  tag?: string | string[];

  /** Optional callback URL (query param: callback). */
  callback?: string;

  /** Optional callback HTTP method (query param: callback_method). */
  callback_method?: string;
};

const DEFAULT_VALUE = "__default__";

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

type DeepgramEncoding =
  | "linear16"
  | "flac"
  | "mulaw"
  | "alaw"
  | "mp3"
  | "opus"
  | "aac";

const ENCODINGS: DeepgramEncoding[] = [
  "mp3",
  "linear16",
  "opus",
  "aac",
  "flac",
  "mulaw",
  "alaw",
];

const getAllowedContainers = (encoding?: string): string[] => {
  switch (encoding as DeepgramEncoding) {
    case "opus":
      return ["ogg"];
    case "linear16":
    case "mulaw":
    case "alaw":
      // Docs: container = wav (default) or no container.
      // UI: represent "no container" as "none" for clarity.
      return ["wav", "none"];
    case "mp3":
    case "aac":
    case "flac":
    default:
      // Not specified in docs excerpt; keep permissive but still allow "none".
      return ["none"];
  }
};

const getAllowedSampleRates = (encoding?: string): number[] | "any" => {
  switch (encoding as DeepgramEncoding) {
    case "mp3":
      return [22050];
    case "opus":
      return [48000];
    case "mulaw":
    case "alaw":
      return [8000, 16000];
    case "linear16":
      return [8000, 16000, 24000, 32000, 48000];
    case "aac":
    case "flac":
    default:
      // Not specified in docs excerpt
      return "any";
  }
};

const getBitrateMode = (
  encoding?: string
):
  | { kind: "none" }
  | { kind: "select"; options: number[] }
  | { kind: "range"; min: number; max: number } => {
  switch (encoding as DeepgramEncoding) {
    case "mp3":
      return { kind: "select", options: [32000, 48000] };
    case "opus":
      return { kind: "range", min: 4000, max: 650000 };
    case "aac":
      return { kind: "range", min: 4000, max: 192000 };
    default:
      // Docs only define bit_rate variants for mp3/opus/aac.
      return { kind: "none" };
  }
};

const isAllowed = (value: unknown, allowed: readonly unknown[]): boolean => {
  return allowed.some((x) => x === value);
};

export const DeepgramSpeechConfigForm: React.FC<{
  config: DeepgramSpeechConfig;
  updateConfig: (val: DeepgramSpeechConfig) => void;
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

  // If backend stored a single tag string, treat it as a single item for UX.
  // We won't auto-migrate it until user adds/removes in this UI.
  const tagStringValue = useMemo(() => {
    const v = config?.tag;
    return typeof v === "string" ? normalizeListItem(v) : "";
  }, [config?.tag]);

  const encodingOptions = [
    { value: DEFAULT_VALUE, label: t("providerDefault") },
    ...ENCODINGS.map((e) => ({ value: e, label: e })),
  ];

  const effectiveEncoding = config?.encoding;
  const containerOptionsRaw = getAllowedContainers(effectiveEncoding);
  const containerOptions = [
    { value: DEFAULT_VALUE, label: t("providerDefault") },
    ...containerOptionsRaw.map((c) => ({ value: c, label: c })),
  ];

  const sampleRates = getAllowedSampleRates(effectiveEncoding);
  const sampleRateOptions =
    sampleRates === "any"
      ? [{ value: DEFAULT_VALUE, label: t("providerDefault") }]
      : [
          { value: DEFAULT_VALUE, label: t("providerDefault") },
          ...sampleRates.map((sr: number) => ({
            value: String(sr),
            label: String(sr),
          })),
        ];

  const bitrateMode = getBitrateMode(effectiveEncoding);

  const callbackMethodOptions = [
    { value: DEFAULT_VALUE, label: t("providerDefault") },
    { value: "POST", label: "POST" },
    { value: "PUT", label: "PUT" },
  ];

  const onChangeEncoding = (val: string) => {
    const raw = String(val ?? "");
    const nextEncoding = raw === DEFAULT_VALUE ? undefined : raw;

    // Auto-clear dependent fields if they become incompatible.
    const nextAllowedContainers = getAllowedContainers(nextEncoding);
    const nextContainer =
      config?.container && isAllowed(config.container, nextAllowedContainers)
        ? config.container
        : undefined;

    const nextAllowedSampleRates = getAllowedSampleRates(nextEncoding);
    const nextSampleRate =
      typeof config?.sample_rate === "number" &&
      Array.isArray(nextAllowedSampleRates) &&
      isAllowed(config.sample_rate, nextAllowedSampleRates)
        ? config.sample_rate
        : Array.isArray(nextAllowedSampleRates)
          ? undefined
          : config.sample_rate; // keep if unknown/unrestricted

    const nextBitrateMode = getBitrateMode(nextEncoding);
    const nextBitRate = (() => {
      const br = config?.bit_rate;
      if (typeof br !== "number") return undefined;

      if (nextBitrateMode.kind === "none") return undefined;
      if (nextBitrateMode.kind === "select")
        return isAllowed(br, nextBitrateMode.options) ? br : undefined;
      if (nextBitrateMode.kind === "range")
        return br >= nextBitrateMode.min && br <= nextBitrateMode.max
          ? br
          : undefined;
      return undefined;
    })();

    updateConfig({
      ...config,
      encoding: nextEncoding,
      container: nextContainer,
      sample_rate: nextSampleRate,
      bit_rate: nextBitRate,
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("general")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Select
            label={t("providers:deepgram.speech.encoding")}
            values={[config?.encoding ?? DEFAULT_VALUE]}
            valueTitle={
              encodingOptions.find((o) => o.value === (config?.encoding ?? DEFAULT_VALUE))
                ?.label
            }
            options={encodingOptions}
            onChange={onChangeEncoding}
            style={{ minWidth: 220 }}
          >
            {encodingOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>

          <theme.Select
            label={t("providers:deepgram.speech.container")}
            values={[config?.container ?? DEFAULT_VALUE]}
            valueTitle={
              containerOptions.find(
                (o) => o.value === (config?.container ?? DEFAULT_VALUE)
              )?.label
            }
            options={containerOptions}
            onChange={(val: string) => {
              const raw = String(val ?? "");
              const next = raw === DEFAULT_VALUE ? undefined : raw;
              // If user selects something not compatible, ignore.
              if (next && !isAllowed(next, containerOptionsRaw)) return;
              updateConfig({ ...config, container: next });
            }}
            style={{ minWidth: 220 }}
            disabled={!effectiveEncoding}
          >
            {containerOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>

          <theme.Select
            label={t("speechSettings.sampleRate")}
            values={[
              typeof config?.sample_rate === "number"
                ? String(config.sample_rate)
                : DEFAULT_VALUE,
            ]}
            valueTitle={
              sampleRateOptions.find(
                (o) =>
                  o.value ===
                  (typeof config?.sample_rate === "number"
                    ? String(config.sample_rate)
                    : DEFAULT_VALUE)
              )?.label
            }
            options={sampleRateOptions}
            onChange={(val: string) => {
              const raw = String(val ?? "");
              if (raw === DEFAULT_VALUE) {
                updateConfig({ ...config, sample_rate: undefined });
                return;
              }
              const next = Number(raw);
              if (Array.isArray(sampleRates) && !isAllowed(next, sampleRates)) return;
              updateConfig({ ...config, sample_rate: next });
            }}
            style={{ minWidth: 220 }}
            disabled={!effectiveEncoding || sampleRates === "any"}
          >
            {sampleRateOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>

          {bitrateMode.kind === "select" && (
            <theme.Select
              label={t("providers:deepgram.speech.bitRate")}
              values={[
                typeof config?.bit_rate === "number"
                  ? String(config.bit_rate)
                  : DEFAULT_VALUE,
              ]}
              valueTitle={
                [
                  { value: DEFAULT_VALUE, label: t("providerDefault") },
                  ...bitrateMode.options.map((b) => ({
                    value: String(b),
                    label: String(b),
                  })),
                ].find(
                  (o) =>
                    o.value ===
                    (typeof config?.bit_rate === "number"
                      ? String(config.bit_rate)
                      : DEFAULT_VALUE)
                )?.label
              }
              options={[]}
              onChange={(val: string) => {
                const raw = String(val ?? "");
                if (raw === DEFAULT_VALUE) {
                  updateConfig({ ...config, bit_rate: undefined });
                  return;
                }
                const next = Number(raw);
                if (!isAllowed(next, bitrateMode.options)) return;
                updateConfig({ ...config, bit_rate: next });
              }}
              style={{ minWidth: 220 }}
              disabled={!effectiveEncoding}
            >
              <option value={DEFAULT_VALUE}>{t("providerDefault")}</option>
              {bitrateMode.options.map((b) => (
                <option key={b} value={String(b)}>
                  {String(b)}
                </option>
              ))}
            </theme.Select>
          )}

          {bitrateMode.kind === "range" && (
            <theme.Input
              id="deepgram-speech-bit-rate"
              type="number"
              step={1}
              min={bitrateMode.min}
              max={bitrateMode.max}
              label={t("providers:deepgram.speech.bitRate")}
              placeholder={`ex. ${Math.min(48000, bitrateMode.max)}`}
              value={config?.bit_rate ?? ""}
              onChange={(e: any) => {
                const raw = String(e?.target?.value ?? "").trim();
                if (!raw.length) {
                  updateConfig({ ...config, bit_rate: undefined });
                  return;
                }
                const next = Number(raw);
                if (Number.isNaN(next)) return;
                if (next < bitrateMode.min || next > bitrateMode.max) return;
                updateConfig({ ...config, bit_rate: next });
              }}
            />
          )}

          <theme.Switch
            id="deepgram-speech-mip-opt-out"
            label={t("providers:deepgram.speech.mipOptOut")}
            checked={config?.mip_opt_out ?? false}
            onChange={(enabled) => updateConfig({ ...config, mip_opt_out: enabled })}
          />

          <theme.Input
            id="deepgram-speech-callback"
            label={t("providers:deepgram.speech.callback")}
            placeholder="https://example.com/webhook"
            value={config?.callback ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateConfig({
                ...config,
                callback: raw ? raw : undefined,
              });
            }}
          />

          <theme.Select
            label={t("providers:deepgram.speech.callbackMethod")}
            values={[config?.callback_method ?? DEFAULT_VALUE]}
            valueTitle={
              callbackMethodOptions.find(
                (o) => o.value === (config?.callback_method ?? DEFAULT_VALUE)
              )?.label
            }
            options={callbackMethodOptions}
            onChange={(val: string) => {
              const raw = String(val ?? "");
              updateConfig({
                ...config,
                callback_method: raw === DEFAULT_VALUE ? undefined : raw,
              });
            }}
            style={{ minWidth: 220 }}
            disabled={!config?.callback}
          >
            {callbackMethodOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>
        </div>
      </theme.Card>

      <theme.Card size="small" title={t("providers:deepgram.tags")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {tagStringValue && tagItems.length === 0 && (
            <div style={{ opacity: 0.8, fontSize: 12 }}>
              {t("providers:deepgram.speech.singleTagDetected", {
                tag: tagStringValue,
              })}
            </div>
          )}
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

