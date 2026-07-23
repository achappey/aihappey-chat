import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

const DEFAULT_MODERATION = {
  model: "omni-moderation-latest",
  policy: {
    input: { mode: "score" },
    output: { mode: "score" },
  },
} as const;

const MODERATION_MODES = ["score", "block"] as const;
type ModerationMode = (typeof MODERATION_MODES)[number];

const toModerationMode = (value: unknown): ModerationMode =>
  MODERATION_MODES.includes(value as ModerationMode)
    ? (value as ModerationMode)
    : "score";

const omitModeration = (config: any) => {
  const { moderation: _moderation, ...rest } = config ?? {};
  return rest;
};

export const OpenAIModerationForm = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const moderationEnabled = !!config?.moderation;
  const model =
    typeof config?.moderation?.model === "string"
      ? config.moderation.model
      : DEFAULT_MODERATION.model;
  const inputMode = toModerationMode(config?.moderation?.policy?.input?.mode);
  const outputMode = toModerationMode(config?.moderation?.policy?.output?.mode);

  const updateModeration = (nextModel: string, nextInputMode: ModerationMode, nextOutputMode: ModerationMode) =>
    updateConfig({
      ...config,
      moderation: {
        model: nextModel,
        policy: {
          input: { mode: nextInputMode },
          output: { mode: nextOutputMode },
        },
      },
    });

  return (
    <theme.Card
      size="small"
      title={t("providers:openai.moderation.title")}
      headerActions={
        <theme.Switch
          id="openai-moderation-enabled"
          checked={moderationEnabled}
          onChange={(enabled: boolean) =>
            enabled
              ? updateConfig({ ...config, moderation: DEFAULT_MODERATION })
              : updateConfig(omitModeration(config))
          }
        />
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <theme.Input
          label={t("providers:openai.moderation.model")}
          disabled={!moderationEnabled}
          value={model}
          onChange={(event: any) =>
            updateModeration(
              String(event?.target?.value ?? ""),
              inputMode,
              outputMode
            )
          }
        />

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <theme.Select
            label={t("providers:openai.moderation.inputMode")}
            style={{ flex: "1 1 0" }}
            disabled={!moderationEnabled}
            values={[inputMode]}
            valueTitle={t(`providers:openai.moderation.modes.${inputMode}`)}
            options={MODERATION_MODES.map((value) => ({
              value,
              label: t(`providers:openai.moderation.modes.${value}`),
            }))}
            onChange={(value: string) =>
              updateModeration(model, toModerationMode(value), outputMode)
            }
          >
            {MODERATION_MODES.map((value) => (
              <option key={value} value={value}>
                {t(`providers:openai.moderation.modes.${value}`)}
              </option>
            ))}
          </theme.Select>

          <theme.Select
            label={t("providers:openai.moderation.outputMode")}
            style={{ flex: "1 1 0" }}
            disabled={!moderationEnabled}
            values={[outputMode]}
            valueTitle={t(`providers:openai.moderation.modes.${outputMode}`)}
            options={MODERATION_MODES.map((value) => ({
              value,
              label: t(`providers:openai.moderation.modes.${value}`),
            }))}
            onChange={(value: string) =>
              updateModeration(model, inputMode, toModerationMode(value))
            }
          >
            {MODERATION_MODES.map((value) => (
              <option key={value} value={value}>
                {t(`providers:openai.moderation.modes.${value}`)}
              </option>
            ))}
          </theme.Select>
        </div>
      </div>
    </theme.Card>
  );
};
