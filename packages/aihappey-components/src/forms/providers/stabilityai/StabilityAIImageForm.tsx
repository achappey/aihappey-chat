import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

export type StabilityAIImageConfig = {
  negative_prompt?: string
  style_preset?: any
};

export const StabilityAIImageForm: React.FC<{
  config: StabilityAIImageConfig;
  updateConfig: (val: StabilityAIImageConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  // Stability AI: style_preset (enum)
  const stabilityAiStylePresetOptions = [
    { value: " ", label: t("providers:stabilityai.no_style_preset") },
    { value: "3d-model", label: t("providers:stabilityai.style_preset.3d-model") },
    { value: "analog-film", label: t("providers:stabilityai.style_preset.analog-film") },
    { value: "anime", label: t("providers:stabilityai.style_preset.anime") },
    { value: "cinematic", label: t("providers:stabilityai.style_preset.cinematic") },
    { value: "comic-book", label: t("providers:stabilityai.style_preset.comic-book") },
    { value: "digital-art", label: t("providers:stabilityai.style_preset.digital-art") },
    { value: "enhance", label: t("providers:stabilityai.style_preset.enhance") },
    { value: "fantasy-art", label: t("providers:stabilityai.style_preset.fantasy-art") },
    { value: "isometric", label: t("providers:stabilityai.style_preset.isometric") },
    { value: "line-art", label: t("providers:stabilityai.style_preset.line-art") },
    { value: "low-poly", label: t("providers:stabilityai.style_preset.low-poly") },
    { value: "modeling-compound", label: t("providers:stabilityai.style_preset.modeling-compound") },
    { value: "neon-punk", label: t("providers:stabilityai.style_preset.neon-punk") },
    { value: "origami", label: t("providers:stabilityai.style_preset.origami") },
    { value: "photographic", label: t("providers:stabilityai.style_preset.photographic") },
    { value: "pixel-art", label: t("providers:stabilityai.style_preset.pixel-art") },
    { value: "tile-texture", label: t("providers:stabilityai.style_preset.tile-texture") },
  ] as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card
        size="small"
        title={t("general")}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Select
            freeform
            label={t("providers:stabilityai.style_presetLabel")}
            hint={t("providers:stabilityai.style_presetHint")}
            values={config?.style_preset ? [config?.style_preset] : []}
            valueTitle={
              config?.style_preset ? stabilityAiStylePresetOptions.find((o) => o.value === config?.style_preset)
                ?.label : ""
            }
            options={stabilityAiStylePresetOptions}
            onChange={(val: string) =>
              updateConfig({
                ...config,
                style_preset: val && val.length > 1 ? val : undefined,
              })
            }
            style={{ minWidth: 220 }}
          >
            {stabilityAiStylePresetOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>

          <theme.TextArea
            label={t("providers:stabilityai.negativePrompt")}
            value={config?.negative_prompt ?? ""}
            onChange={(val: string) =>
              updateConfig({
                ...config,
                negative_prompt: val
              })
            }>

          </theme.TextArea>
        </div>
      </theme.Card>
    </div>
  );
};
