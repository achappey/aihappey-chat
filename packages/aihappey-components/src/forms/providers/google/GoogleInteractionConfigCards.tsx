import { useState } from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../theme/ThemeContext";

export type GoogleInteractionSpeechConfig = {
  language?: string;
  speaker?: string;
  voice?: string;
  [key: string]: any;
};

export type GoogleInteractionTranscriptionConfig = {
  custom_vocabulary?: string[];
  diarization_mode?: string;
  language_codes?: string[];
  timestamp_granularities?: string[];
  [key: string]: any;
};

export type GoogleResponseFormat = {
  type: "text" | "audio" | "image" | "video" | string;
  [key: string]: any;
};

export type GoogleRetrievalTool = {
  type?: string;
  retrieval_types?: string[];
  exa_ai_search_config?: { api_key?: string; [key: string]: any };
  parallel_ai_search_config?: { api_key?: string; [key: string]: any };
  [key: string]: any;
};

export const normalizeGoogleResponseFormatValue = (
  value?: GoogleResponseFormat | GoogleResponseFormat[],
) => {
  if (value === undefined || value === null) return undefined;
  const formats = Array.isArray(value) ? value : [value];

  return formats.map((format) => {
    if (format.type === "text") return { type: "text" };
    if (format.type === "image") {
      const { mime_type: _mimeType, ...rest } = format;
      return { ...rest, type: "image", delivery: "inline" };
    }
    if (format.type === "video") {
      const { gcs_uri: _gcsUri, ...rest } = format;
      return { ...rest, type: "video", delivery: "inline" };
    }
    if (format.type === "audio") {
      return { ...format, type: "audio", delivery: "inline" };
    }
    return format;
  });
};

const RESPONSE_FORMAT_TYPES = ["text", "audio", "image", "video"] as const;
const AUDIO_MIME_TYPE_OPTIONS = [
  "audio/mp3",
  "audio/ogg_opus",
  "audio/l16",
  "audio/wav",
  "audio/alaw",
  "audio/mulaw",
] as const;
const IMAGE_ASPECT_RATIO_OPTIONS = [
  "1:1",
  "2:3",
  "3:2",
  "3:4",
  "4:3",
  "4:5",
  "5:4",
  "9:16",
  "16:9",
  "21:9",
  "1:8",
  "8:1",
  "1:4",
  "4:1",
] as const;
const IMAGE_SIZE_OPTIONS = ["512", "1K", "2K", "4K"] as const;
const VIDEO_ASPECT_RATIO_OPTIONS = ["16:9", "9:16"] as const;

const cardStackStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
} as const;

const responsiveGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
} as const;

const itemStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 10,
  padding: 8,
} as const;

const parseOptionalInteger = (value: unknown) => {
  const raw = String(value ?? "").trim();
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isInteger(parsed) ? parsed : undefined;
};

const selectOptions = (values: readonly string[], providerDefault: string) => [
  { value: "", label: providerDefault },
  ...values.map((value) => ({ value, label: value })),
];

const GoogleStringListEditor = ({
  id,
  label,
  values,
  disabled,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  values: string[];
  disabled?: boolean;
  placeholder?: string;
  onChange: (values: string[] | undefined) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [draft, setDraft] = useState("");
  const normalizedDraft = draft.trim();

  const addValue = () => {
    if (!normalizedDraft || values.includes(normalizedDraft)) return;
    onChange([...values, normalizedDraft]);
    setDraft("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <theme.Input
            id={`${id}-draft`}
            label={label}
            disabled={disabled}
            placeholder={placeholder}
            value={draft}
            onChange={(event: any) => setDraft(String(event?.target?.value ?? ""))}
            onKeyDown={(event: any) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addValue();
              }
            }}
          />
        </div>
        <theme.Button
          type="button"
          icon="add"
          size="small"
          variant="informative"
          title={t("add")}
          disabled={disabled || !normalizedDraft || values.includes(normalizedDraft)}
          onClick={addValue}
        >
          {t("add")}
        </theme.Button>
      </div>

      {values.map((value, index) => (
        <div
          key={`${id}-${value}-${index}`}
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            justifyContent: "space-between",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 10,
            padding: "8px 10px",
          }}
        >
          <div style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
            {value}
          </div>
          <theme.Button
            type="button"
            icon="delete"
            size="small"
            variant="danger"
            title={t("delete")}
            disabled={disabled}
            onClick={() => {
              const nextValues = values.filter((_, valueIndex) => valueIndex !== index);
              onChange(nextValues.length ? nextValues : undefined);
            }}
          />
        </div>
      ))}
    </div>
  );
};

export const GoogleInteractionSpeechCard = ({
  value,
  onChange,
}: {
  value?: GoogleInteractionSpeechConfig[];
  onChange: (value: GoogleInteractionSpeechConfig[] | undefined) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const enabled = Array.isArray(value);
  const rows = enabled ? value : [];

  const updateRow = (index: number, next: Partial<GoogleInteractionSpeechConfig>) => {
    onChange(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...next } : row)));
  };

  return (
    <theme.Card
      size="small"
      title={t("providers:google.interactions.speech.title")}
      headerActions={
        <theme.Switch
          id="googleInteractionSpeech"
          checked={enabled}
          onChange={(checked) => onChange(checked ? [{}] : undefined)}
        />
      }
    >
      <div style={cardStackStyle}>
        {rows.map((row, index) => (
          <div key={`google-interaction-speech-${index}`} style={itemStyle}>
            <div style={responsiveGridStyle}>
              <theme.Input
                label={t("providers:google.interactions.speech.language")}
                disabled={!enabled}
                placeholder="en-US"
                value={row.language ?? ""}
                onChange={(event: any) =>
                  updateRow(index, {
                    language: String(event?.target?.value ?? "").trim() || undefined,
                  })
                }
              />
              <theme.Input
                label={t("providers:google.interactions.speech.speaker")}
                disabled={!enabled}
                value={row.speaker ?? ""}
                onChange={(event: any) =>
                  updateRow(index, {
                    speaker: String(event?.target?.value ?? "").trim() || undefined,
                  })
                }
              />
              <theme.Input
                label={t("providers:google.interactions.speech.voice")}
                disabled={!enabled}
                value={row.voice ?? ""}
                onChange={(event: any) =>
                  updateRow(index, {
                    voice: String(event?.target?.value ?? "").trim() || undefined,
                  })
                }
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <theme.Button
                type="button"
                icon="delete"
                size="small"
                variant="danger"
                title={t("delete")}
                disabled={!enabled || rows.length === 1}
                onClick={() => onChange(rows.filter((_, rowIndex) => rowIndex !== index))}
              />
            </div>
          </div>
        ))}

        <div>
          <theme.Button
            type="button"
            icon="add"
            size="small"
            variant="subtle"
            disabled={!enabled || rows.length >= 2}
            onClick={() => onChange([...rows, {}])}
          >
            {t("providers:google.interactions.speech.addSpeaker")}
          </theme.Button>
        </div>
      </div>
    </theme.Card>
  );
};

export const GoogleInteractionTranscriptionCard = ({
  value,
  onChange,
}: {
  value?: GoogleInteractionTranscriptionConfig;
  onChange: (value: GoogleInteractionTranscriptionConfig | undefined) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const enabled = !!value;
  const config = value ?? {};
  const languageCodes = Array.isArray(config.language_codes) ? config.language_codes : [];
  const vocabulary = Array.isArray(config.custom_vocabulary) ? config.custom_vocabulary : [];

  return (
    <theme.Card
      size="small"
      title={t("providers:google.interactions.transcription.title")}
      headerActions={
        <theme.Switch
          id="googleInteractionTranscription"
          checked={enabled}
          onChange={(checked) => onChange(checked ? {} : undefined)}
        />
      }
    >
      <div style={cardStackStyle}>
        <GoogleStringListEditor
          id="google-transcription-language-code"
          label={t("providers:google.interactions.transcription.languageCodes")}
          placeholder="en-US"
          disabled={!enabled}
          values={languageCodes}
          onChange={(language_codes) => onChange({ ...config, language_codes })}
        />
        <GoogleStringListEditor
          id="google-transcription-vocabulary"
          label={t("providers:google.interactions.transcription.customVocabulary")}
          disabled={!enabled}
          values={vocabulary}
          onChange={(custom_vocabulary) => onChange({ ...config, custom_vocabulary })}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <theme.Switch
            id="googleTranscriptionDiarization"
            disabled={!enabled}
            checked={config.diarization_mode === "speaker"}
            label={t("providers:google.interactions.transcription.speakerDiarization")}
            onChange={(checked) =>
              onChange({
                ...config,
                diarization_mode: checked ? "speaker" : undefined,
              })
            }
          />
          <theme.Switch
            id="googleTranscriptionWordTimestamps"
            disabled={!enabled}
            checked={config.timestamp_granularities?.includes("word") ?? false}
            label={t("providers:google.interactions.transcription.wordTimestamps")}
            onChange={(checked) =>
              onChange({
                ...config,
                timestamp_granularities: checked ? ["word"] : undefined,
              })
            }
          />
        </div>
      </div>
    </theme.Card>
  );
};

const ResponseFormatFields = ({
  format,
  disabled,
  onChange,
}: {
  format: GoogleResponseFormat;
  disabled?: boolean;
  onChange: (format: GoogleResponseFormat) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const providerDefault = t("providerDefault");
  const renderSelect = (
    property: string,
    label: string,
    values: readonly string[],
  ) => {
    const options = selectOptions(values, providerDefault);
    const selected = String(format[property] ?? "");
    return (
      <theme.Select
        label={label}
        disabled={disabled}
        values={[selected]}
        valueTitle={options.find((option) => option.value === selected)?.label ?? selected}
        options={options}
        onChange={(value: string) =>
          onChange({ ...format, [property]: String(value ?? "") || undefined })
        }
      >
        {options.map((option) => (
          <option key={option.value || "provider-default"} value={option.value}>
            {option.label}
          </option>
        ))}
      </theme.Select>
    );
  };

  if (format.type === "text") return null;

  if (format.type === "audio") {
    return (
      <div style={responsiveGridStyle}>
        {renderSelect(
          "mime_type",
          t("providers:google.interactions.responseFormat.mimeType"),
          AUDIO_MIME_TYPE_OPTIONS,
        )}
        <theme.Input
          type="number"
          step={1}
          label={t("providers:google.interactions.responseFormat.sampleRate")}
          disabled={disabled}
          value={format.sample_rate ?? ""}
          onChange={(event: any) =>
            onChange({ ...format, sample_rate: parseOptionalInteger(event?.target?.value) })
          }
        />
        <theme.Input
          type="number"
          step={1}
          label={t("providers:google.interactions.responseFormat.bitRate")}
          disabled={disabled}
          value={format.bit_rate ?? ""}
          onChange={(event: any) =>
            onChange({ ...format, bit_rate: parseOptionalInteger(event?.target?.value) })
          }
        />
      </div>
    );
  }

  if (format.type === "image") {
    return (
      <div style={responsiveGridStyle}>
        {renderSelect(
          "aspect_ratio",
          t("providers:google.interactions.responseFormat.aspectRatio"),
          IMAGE_ASPECT_RATIO_OPTIONS,
        )}
        {renderSelect(
          "image_size",
          t("providers:google.interactions.responseFormat.imageSize"),
          IMAGE_SIZE_OPTIONS,
        )}
      </div>
    );
  }

  if (format.type === "video") {
    return (
      <div style={responsiveGridStyle}>
        {renderSelect(
          "aspect_ratio",
          t("providers:google.interactions.responseFormat.aspectRatio"),
          VIDEO_ASPECT_RATIO_OPTIONS,
        )}
        <theme.Input
          label={t("providers:google.interactions.responseFormat.duration")}
          disabled={disabled}
          value={format.duration ?? ""}
          onChange={(event: any) =>
            onChange({
              ...format,
              duration: String(event?.target?.value ?? "").trim() || undefined,
            })
          }
        />
      </div>
    );
  }

  return null;
};

export const GoogleResponseFormatCard = ({
  value,
  onChange,
}: {
  value?: GoogleResponseFormat | GoogleResponseFormat[];
  onChange: (value: GoogleResponseFormat[] | undefined) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const enabled = value !== undefined && value !== null;
  const formats = Array.isArray(value) ? value : value ? [value] : [];
  const configuredTypes = new Set(formats.map((format) => format?.type));

  const emitFormats = (nextFormats: GoogleResponseFormat[]) =>
    onChange(normalizeGoogleResponseFormatValue(nextFormats));

  const updateFormat = (index: number, next: GoogleResponseFormat) =>
    emitFormats(
      formats.map((format, formatIndex) => (formatIndex === index ? next : format)),
    );

  return (
    <theme.Card
      size="small"
      title={t("providers:google.interactions.responseFormat.title")}
      headerActions={
        <theme.Switch
          id="googleResponseFormat"
          checked={enabled}
          onChange={(checked) => onChange(checked ? [{ type: "text" }] : undefined)}
        />
      }
    >
      <div style={cardStackStyle}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {RESPONSE_FORMAT_TYPES.filter((type) => !configuredTypes.has(type)).map((type) => (
            <theme.Button
              key={type}
              type="button"
              icon="add"
              size="small"
              variant="subtle"
              disabled={!enabled}
              onClick={() =>
                emitFormats([
                  ...formats,
                  type === "text" ? { type } : { type, delivery: "inline" },
                ])
              }
            >
              {t(`providers:google.interactions.responseFormat.types.${type}`)}
            </theme.Button>
          ))}
        </div>

        {formats.map((format, index) => (
          <div key={`${format.type}-${index}`} style={itemStyle}>
            <div style={{ fontWeight: 600 }}>
              {t(`providers:google.interactions.responseFormat.types.${format.type}`)}
            </div>
            <ResponseFormatFields
              format={format}
              disabled={!enabled}
              onChange={(next) => updateFormat(index, next)}
            />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <theme.Button
                type="button"
                icon="delete"
                size="small"
                variant="danger"
                title={t("delete")}
                disabled={!enabled || formats.length === 1}
                onClick={() =>
                  emitFormats(formats.filter((_, formatIndex) => formatIndex !== index))
                }
              />
            </div>
          </div>
        ))}
      </div>
    </theme.Card>
  );
};

export const GoogleRetrievalSearchCard = ({
  provider,
  value,
  onChange,
}: {
  provider: "exa" | "parallel";
  value?: GoogleRetrievalTool;
  onChange: (enabled: boolean, apiKey?: string) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const retrievalType = provider === "exa" ? "exa_ai_search" : "parallel_ai_search";
  const configKey =
    provider === "exa" ? "exa_ai_search_config" : "parallel_ai_search_config";
  const enabled =
    value?.retrieval_types?.includes(retrievalType) || value?.[configKey] !== undefined;
  const apiKey = String(value?.[configKey]?.api_key ?? "");

  return (
    <theme.Card
      size="small"
      title={t(`providers:google.interactions.retrieval.${provider}.title`)}
      headerActions={
        <theme.Switch
          id={`googleRetrieval${provider}`}
          checked={!!enabled}
          onChange={(checked) => onChange(!!checked, checked ? apiKey : undefined)}
        />
      }
    >
      <theme.Input
        type="password"
        autoComplete="off"
        label={t("providers:google.interactions.retrieval.apiKey")}
        disabled={!enabled}
        value={apiKey}
        onChange={(event: any) => onChange(true, String(event?.target?.value ?? ""))}
      />
    </theme.Card>
  );
};
