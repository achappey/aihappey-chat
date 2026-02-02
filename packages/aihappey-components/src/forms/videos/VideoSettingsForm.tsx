import React from "react";
import { useTheme } from "../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import { VideoSizeSettingsForm } from "./VideoSizeSettingsForm";
import { VideoAspectRatioSettingsForm } from "./VideoAspectRatioSettingsForm";

export type VideoSettings = {
  duration?: number;
  resolution?: string;
  fps?: number;
  aspectRatio?: string;
  n: number;
  seed?: number;
  maxVideosPerCall?: number;
};

export type VideoSettingsFormProps = {
  value: VideoSettings;
  onChange: (next: VideoSettings) => void;
};

export const VideoSettingsForm: React.FC<VideoSettingsFormProps> = ({
  value,
  onChange,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <VideoSizeSettingsForm
        value={{ resolution: value.resolution }}
        onChange={(next) => onChange({ ...value, resolution: next.resolution })}
      />

      <VideoAspectRatioSettingsForm
        value={{ aspectRatio: value.aspectRatio }}
        onChange={(next) => onChange({ ...value, aspectRatio: next.aspectRatio })}
      />

      <theme.Card size="small" title={t("videoSettings.output")}>
        <div>
          <theme.Slider
            label={t("videoSettings.n", { n: value.n })}
            min={1}
            max={10}
            value={value.n ?? 1}
            onChange={(e: number) => {
              onChange({ ...value, n: e });
            }}
          />

          <theme.Input
            label={t("videoSettings.maxVideosPerCall")}
            type="number"
            value={String(value.maxVideosPerCall ?? "")}
            onChange={(e: any) => {
              const next = e.target.value ? Number(e.target.value) : undefined;
              onChange({ ...value, maxVideosPerCall: next });
            }}
          />
        </div>
      </theme.Card>

      <theme.Card size="small" title={t("videoSettings.other")}>
        <div>
          <theme.Input
            label={t("videoSettings.duration")}
            type="number"
            value={value.duration === undefined ? "" : String(value.duration)}
            onChange={(e: any) => {
              const raw = String(e.target.value ?? "").trim();
              if (!raw) {
                onChange({ ...value, duration: undefined });
                return;
              }
              const parsed = Number(raw);
              onChange({
                ...value,
                duration: Number.isFinite(parsed) ? parsed : undefined,
              });
            }}
          />

          <theme.Input
            label={t("videoSettings.fps")}
            type="number"
            value={value.fps === undefined ? "" : String(value.fps)}
            onChange={(e: any) => {
              const raw = String(e.target.value ?? "").trim();
              if (!raw) {
                onChange({ ...value, fps: undefined });
                return;
              }
              const parsed = Number(raw);
              onChange({
                ...value,
                fps: Number.isFinite(parsed) ? parsed : undefined,
              });
            }}
          />


          <theme.Input
            label={t("videoSettings.seed")}
            type="number"
            value={value.seed === undefined ? "" : String(value.seed)}
            onChange={(e: any) => {
              const raw = String(e.target.value ?? "").trim();
              if (!raw) {
                onChange({ ...value, seed: undefined });
                return;
              }
              const parsed = Number(raw);
              onChange({
                ...value,
                seed: Number.isFinite(parsed) ? parsed : undefined,
              });
            }}
          />

        </div>
      </theme.Card>
    </div>
  );
};
