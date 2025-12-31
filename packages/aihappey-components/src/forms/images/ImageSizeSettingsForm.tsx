import React, { useMemo } from "react";
import { useTheme } from "../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

type Preset = { w: number; h: number; label?: string };

export type ImageSizeSettings = {
  /** `{width}x{height}` or undefined for provider default */
  size?: string;
};

export type ImageSizeSettingsFormProps = {
  value: ImageSizeSettings;
  onChange: (next: ImageSizeSettings) => void;
  sizePresets?: Preset[];
};

const DEFAULT_SIZE_PRESETS: Preset[] = [
  { w: 256, h: 256 },
  { w: 512, h: 512 },
  { w: 768, h: 768 },
  { w: 1024, h: 1024 },
  { w: 1024, h: 1536 },
  { w: 1536, h: 1024 },
];

const DEFAULT_VALUE = "__default__";
const CUSTOM_VALUE = "__custom__";

const parseSize = (size?: string): { w?: number; h?: number } => {
  if (!size) return {};
  const m = /^\s*(\d+)\s*x\s*(\d+)\s*$/.exec(size);
  if (!m) return {};
  return { w: Number(m[1]), h: Number(m[2]) };
};

const toPositiveInt = (val: any): number | undefined => {
  const n = Number(String(val ?? "").trim());
  if (!Number.isFinite(n)) return undefined;
  const i = Math.floor(n);
  return i > 0 ? i : undefined;
};

export const ImageSizeSettingsForm: React.FC<ImageSizeSettingsFormProps> = ({
  value,
  onChange,
  sizePresets,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const sizes = sizePresets ?? DEFAULT_SIZE_PRESETS;
  const parsed = useMemo(() => parseSize(value.size), [value.size]);

  const isPreset = useMemo(() => {
    if (!parsed.w || !parsed.h) return false;
    return sizes.some(p => p.w === parsed.w && p.h === parsed.h);
  }, [sizes, parsed.w, parsed.h]);

  const mode =
    value.size === undefined
      ? DEFAULT_VALUE
      : isPreset
        ? value.size
        : CUSTOM_VALUE;

  const setFromParts = (w?: number, h?: number) => {
    if (!w || !h) return;
    onChange({ size: `${w}x${h}` });
  };

  const widthValue = parsed.w ? String(parsed.w) : "";
  const heightValue = parsed.h ? String(parsed.h) : "";

  const widthOptions = Array.from(new Set(sizes.map(p => p.w))).sort((a, b) => a - b);
  const heightOptions = Array.from(new Set(sizes.map(p => p.h))).sort((a, b) => a - b);

  return (
    <theme.Card
      size="small"
      title={t("imageSettings.size")}
    >
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <theme.Select
          label={t("size", "size")}
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
              onChange({ size: undefined });
              return;
            }
            if (val === CUSTOM_VALUE) {
              setFromParts(parsed.w ?? widthOptions[0], parsed.h ?? heightOptions[0]);
              return;
            }
            onChange({ size: val });
          }}
          style={{ minWidth: 220 }}
        >
          <option value={DEFAULT_VALUE}>{t("providerDefault")}</option>
          {sizes.map(p => (
            <option key={`${p.w}x${p.h}`} value={`${p.w}x${p.h}`}>
              {p.label ?? `${p.w}x${p.h}`}
            </option>
          ))}
          <option value={CUSTOM_VALUE}>{t("custom")}</option>
        </theme.Select>

        <theme.Input
          label={t("imageSettings.width")}
          type="number"
          style={{ width: 120 }}
          disabled={value.size === undefined}
          value={widthValue}
          onChange={(e: any) => {
            const w = toPositiveInt(e.target.value);
            setFromParts(w, parsed.h);
          }}
        />

        <theme.Input
          label={t("imageSettings.height")}
          type="number"
          style={{ width: 120 }}
          disabled={value.size === undefined}
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
