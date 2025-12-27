import React, { useMemo } from "react";
import { useTheme } from "../../theme/ThemeContext";

type Preset = { w: number; h: number; label?: string };

export type ImageAspectRatioSettings = {
  /** `{width}:{height}` or undefined for provider default */
  aspectRatio?: string;
};

export type ImageAspectRatioSettingsTranslations = {
  formTitle?: string;
  aspectRatio?: string;
  width?: string;
  height?: string;
  providerDefault?: string;
  custom?: string;
};

export type ImageAspectRatioSettingsFormProps = {
  value: ImageAspectRatioSettings;
  onChange: (next: ImageAspectRatioSettings) => void;
  translations?: ImageAspectRatioSettingsTranslations;
  aspectPresets?: Preset[];
};

const DEFAULT_ASPECT_PRESETS: Preset[] = [
  { w: 1, h: 1, label: "1:1" },
  { w: 4, h: 3, label: "4:3" },
  { w: 3, h: 2, label: "3:2" },
  { w: 16, h: 9, label: "16:9" },
  { w: 9, h: 16, label: "9:16" },
  { w: 2, h: 3, label: "2:3" },
  { w: 3, h: 4, label: "3:4" },
];

const DEFAULT_VALUE = "__default__";
const CUSTOM_VALUE = "__custom__";

const parseAspect = (aspectRatio?: string): { w?: number; h?: number } => {
  if (!aspectRatio) return {};
  const m = /^\s*(\d+)\s*:\s*(\d+)\s*$/.exec(aspectRatio);
  if (!m) return {};
  return { w: Number(m[1]), h: Number(m[2]) };
};

const toPositiveInt = (val: any): number | undefined => {
  const n = Number(String(val ?? "").trim());
  if (!Number.isFinite(n)) return undefined;
  const i = Math.floor(n);
  return i > 0 ? i : undefined;
};

export const ImageAspectRatioSettingsForm: React.FC<
  ImageAspectRatioSettingsFormProps
> = ({ value, onChange, translations, aspectPresets }) => {
  const theme = useTheme();

  const t = (key: keyof ImageAspectRatioSettingsTranslations, fallback: string) =>
    (translations as any)?.[key] ?? fallback;

  const aspects = aspectPresets ?? DEFAULT_ASPECT_PRESETS;
  const parsed = useMemo(() => parseAspect(value.aspectRatio), [value.aspectRatio]);

  const isPreset = useMemo(() => {
    if (!parsed.w || !parsed.h) return false;
    return aspects.some(p => p.w === parsed.w && p.h === parsed.h);
  }, [aspects, parsed.w, parsed.h]);

  const mode =
    value.aspectRatio === undefined
      ? DEFAULT_VALUE
      : isPreset
      ? value.aspectRatio
      : CUSTOM_VALUE;

  const setFromParts = (w?: number, h?: number) => {
    if (!w || !h) return;
    onChange({ aspectRatio: `${w}:${h}` });
  };

  const widthValue = parsed.w ? String(parsed.w) : "";
  const heightValue = parsed.h ? String(parsed.h) : "";

  const widthOptions = Array.from(new Set(aspects.map(p => p.w))).sort((a, b) => a - b);
  const heightOptions = Array.from(new Set(aspects.map(p => p.h))).sort((a, b) => a - b);

  return (
    <theme.Card
      size="small"
      title={translations?.formTitle ?? "Aspect ratio"}
    >
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <theme.Select
          label={t("aspectRatio", "aspect ratio")}
          values={[mode]}
          valueTitle={
            mode === DEFAULT_VALUE
              ? t("providerDefault", "provider default")
              : mode === CUSTOM_VALUE
              ? t("custom", "custom")
              : mode
          }
          onChange={(val: string) => {
            if (val === DEFAULT_VALUE) {
              onChange({ aspectRatio: undefined });
              return;
            }
            if (val === CUSTOM_VALUE) {
              setFromParts(parsed.w ?? widthOptions[0], parsed.h ?? heightOptions[0]);
              return;
            }
            onChange({ aspectRatio: val });
          }}
          style={{ minWidth: 220 }}
        >
          <option value={DEFAULT_VALUE}>{t("providerDefault", "provider default")}</option>
          {aspects.map(p => (
            <option key={`${p.w}:${p.h}`} value={`${p.w}:${p.h}`}>
              {p.label ?? `${p.w}:${p.h}`}
            </option>
          ))}
          <option value={CUSTOM_VALUE}>{t("custom", "custom")}</option>
        </theme.Select>

        <theme.Input
          label={t("width", "width")}
          type="number"
          style={{ width: 120 }}
          disabled={value.aspectRatio === undefined}
          value={widthValue}
          onChange={(e: any) => {
            const w = toPositiveInt(e.target.value);
            setFromParts(w, parsed.h);
          }}
        />

        <theme.Input
          label={t("height", "height")}
          type="number"
          style={{ width: 120 }}
          disabled={value.aspectRatio === undefined}
          value={heightValue}
          onChange={(e: any) => {
            const h = toPositiveInt(e.target.value);
            setFromParts(parsed.w, h);
          }}
        />
      </div>
    </theme.Card>
  );
};
