import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

export type OpenAIImageOptions = {
  output_format?: string;
  complexity?: string;
  frame_count?: number;
  frame_duration_ms?: number;
  svg?: {
    model?: string;
    reasoning?: { effort?: string; [key: string]: unknown };
    [key: string]: unknown;
  };
};

type Props = {
  config: OpenAIImageOptions;
  updateConfig: (value: OpenAIImageOptions) => void;
  disabled?: boolean;
  idPrefix?: string;
};

// These are pass-through settings: format compatibility is validated by the API.
export const OpenAIImageOutputFields = ({ config, updateConfig, disabled }: Props) => {
  const theme = useTheme();
  const { t } = useTranslation();
  return <>
    {[
      { key: "output_format" as const, label: t("providers:openai.imageOutputFormat"), values: ["", "png", "jpeg", "webp", "gif", "svg"], fallback: "" },
      { key: "complexity" as const, label: t("providers:openai.imageComplexity"), values: ["", "low", "medium", "high"], fallback: "" },
    ].map(({ key, label, values, fallback }) => {
      const options = values.map(value => ({ value, label: value ? (key === "output_format" ? value.toUpperCase() : t(value)) : t("default") }));
      const value = config[key] ?? fallback;
      return <theme.Select key={key} label={label} disabled={disabled}
        style={{ flex: "1 1 0", minWidth: 0 }}
        values={[value]} valueTitle={options.find(o => o.value === value)?.label ?? value} options={options}
        onChange={(next: string) => updateConfig({ ...config, [key]: next || undefined })}>
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </theme.Select>;
    })}
  </>;
};

export const OpenAIImageFrameFields = ({ config, updateConfig, disabled }: Props) => {
  const theme = useTheme();
  const { t } = useTranslation();
  return <>
    {(["frame_count", "frame_duration_ms"] as const).map(key => <theme.Input
      key={key} label={t(`providers:openai.${key === "frame_count" ? "imageFrameCount" : "imageFrameDuration"}`)}
      type="number" step={1} disabled={disabled} value={String(config[key] ?? "")}
      style={{ flex: "1 1 0", minWidth: 0 }}
      placeholder={key === "frame_count" ? "9" : "200"}
      onChange={event => {
        const raw = event.target.value.trim();
        updateConfig({ ...config, [key]: raw ? Number(raw) : undefined });
      }}
    />)}
  </>;
};

export const OpenAIImageSvgCard = ({ config, updateConfig, disabled, idPrefix = "openai-image" }: Props) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const svgOn = !!config.svg;
  const efforts = ["", "none", "minimal", "low", "medium", "high", "xhigh", "max"]
    .map(value => ({ value, label: value ? t(value) : t("default") }));
  return <theme.Card size="small" title="SVG" headerActions={<theme.Switch
      id={`${idPrefix}-svg`} checked={svgOn} disabled={disabled}
      onChange={() => updateConfig({ ...config, svg: svgOn ? undefined : {} })}
    />}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <theme.Input label={t("providers:openai.imageSvgModel")} disabled={disabled || !svgOn}
          value={config.svg?.model ?? ""}
          onChange={event => updateConfig({ ...config, svg: { ...config.svg, model: event.target.value || undefined } })} />
        <theme.Select label={t("reasoningEffort")} disabled={disabled || !svgOn}
          values={[config.svg?.reasoning?.effort ?? ""]}
          valueTitle={efforts.find(o => o.value === (config.svg?.reasoning?.effort ?? ""))?.label}
          options={efforts} onChange={(effort: string) => {
            const reasoning = { ...config.svg?.reasoning, effort: effort || undefined };
            updateConfig({ ...config, svg: { ...config.svg,
              reasoning: Object.values(reasoning).some(value => value !== undefined) ? reasoning : undefined } });
          }}>
          {efforts.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </theme.Select>
      </div>
    </theme.Card>;
};

export const OpenAIImageOptionsCards = (props: Props) => {
  const theme = useTheme();
  return <>
    <theme.Card size="small" title="GIF">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <OpenAIImageFrameFields {...props} />
      </div>
    </theme.Card>
    <OpenAIImageSvgCard {...props} />
  </>;
};
