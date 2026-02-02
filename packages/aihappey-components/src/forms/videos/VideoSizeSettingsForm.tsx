import React, { useMemo } from "react";
import { useTheme } from "../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

type Preset = { w: number; h: number; label?: string };

export type VideoSizeSettings = {
  /** `{width}x{height}` or undefined for provider default */
  resolution?: string;
};

export type VideoSizeSettingsFormProps = {
  value: VideoSizeSettings;
  onChange: (next: VideoSizeSettings) => void;
  sizePresets?: Preset[];
};

const DEFAULT_SIZE_PRESETS: Preset[] = [
  { w: 640, h: 480 },
  { w: 854, h: 480 },
  { w: 960, h: 540 },
  { w: 1280, h: 720 },
  { w: 1920, h: 1080 },
  { w: 3840, h: 2160 },
  { w: 720, h: 1280 },
  { w: 1024, h: 1792 },
  { w: 1792, h: 1024 },
  { w: 1600, h: 900 },
];

const DEFAULT_VALUE = "__default__";
const CUSTOM_VALUE = "__custom__";

const parseSize = (resolution?: string): { w?: number; h?: number } => {
  if (!resolution) return {};
  const m = /^\s*(\d+)\s*x\s*(\d+)\s*$/.exec(resolution);
  if (!m) return {};
  return { w: Number(m[1]), h: Number(m[2]) };
};

const toPositiveInt = (val: any): number | undefined => {
  const n = Number(String(val ?? "").trim());
  if (!Number.isFinite(n)) return undefined;
  const i = Math.floor(n);
  return i > 0 ? i : undefined;
};

export const VideoSizeSettingsForm: React.FC<VideoSizeSettingsFormProps> = ({
  value,
  onChange,
  sizePresets,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const sizes = sizePresets ?? DEFAULT_SIZE_PRESETS;
  const parsed = useMemo(() => parseSize(value.resolution), [value.resolution]);

  const isPreset = useMemo(() => {
    if (!parsed.w || !parsed.h) return false;
    return sizes.some((p) => p.w === parsed.w && p.h === parsed.h);
  }, [sizes, parsed.w, parsed.h]);

  const mode =
    value.resolution === undefined
      ? DEFAULT_VALUE
      : isPreset
        ? value.resolution
        : CUSTOM_VALUE;

  const setFromParts = (w?: number, h?: number) => {
    if (!w || !h) return;
    onChange({ resolution: `${w}x${h}` });
  };

  const widthValue = parsed.w ? String(parsed.w) : "";
  const heightValue = parsed.h ? String(parsed.h) : "";

  const widthOptions = Array.from(new Set(sizes.map((p) => p.w))).sort(
    (a, b) => a - b
  );
  const heightOptions = Array.from(new Set(sizes.map((p) => p.h))).sort(
    (a, b) => a - b
  );

  return (
    <theme.Card size="small" title={t("videoSettings.size")}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <theme.Select
          label={t("videoSettings.resolution")}
          values={[mode]}
          valueTitle={
            mode === DEFAULT_VALUE
              ? t("providerDefault")
              : mode === CUSTOM_VALUE
                ? t("custom")
                : mode
          }
          onChange={(val: string) => {
            if (val === DEFAULT_VALUE) {
              onChange({ resolution: undefined });
              return;
            }
            if (val === CUSTOM_VALUE) {
              setFromParts(parsed.w ?? widthOptions[0], parsed.h ?? heightOptions[0]);
              return;
            }
            onChange({ resolution: val });
          }}
          style={{ minWidth: 220 }}
        >
          <option value={DEFAULT_VALUE}>{t("providerDefault")}</option>
          {sizes.map((p) => (
            <option key={`${p.w}x${p.h}`} value={`${p.w}x${p.h}`}>
              {p.label ?? `${p.w}x${p.h}`}
            </option>
          ))}
          <option value={CUSTOM_VALUE}>{t("custom")}</option>
        </theme.Select>

        <theme.Input
          label={t("videoSettings.width")}
          type="number"
          style={{ width: 120 }}
          disabled={value.resolution === undefined}
          value={widthValue}
          onChange={(e: any) => {
            const w = toPositiveInt(e.target.value);
            setFromParts(w, parsed.h);
          }}
        />

        <theme.Input
          label={t("videoSettings.height")}
          type="number"
          style={{ width: 120 }}
          disabled={value.resolution === undefined}
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
