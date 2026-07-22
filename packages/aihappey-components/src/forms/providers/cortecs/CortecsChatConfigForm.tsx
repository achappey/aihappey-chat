import { useTranslation } from "aihappey-i18n";

import { useTheme } from "../../../theme/ThemeContext";

const CORTECS_PREFERENCES = ["speed", "cost", "balanced"] as const;

type CortecsPreference = (typeof CORTECS_PREFERENCES)[number];

export type CortecsChatConfig = {
  preference: CortecsPreference;
  eu_native: boolean;
  allow_zero_data_retention: boolean;
  enable_model_fallback: boolean;
  parallel_tool_calls: boolean;
};

const isCortecsPreference = (value: unknown): value is CortecsPreference =>
  typeof value === "string" && CORTECS_PREFERENCES.includes(value as CortecsPreference);

/**
 * Produces the exact provider metadata object accepted by Cortecs chat completions.
 */
export const normalizeCortecsChatConfig = (
  config: Partial<CortecsChatConfig> = {},
): CortecsChatConfig => ({
  preference: isCortecsPreference(config.preference) ? config.preference : "balanced",
  eu_native: typeof config.eu_native === "boolean" ? config.eu_native : false,
  allow_zero_data_retention:
    typeof config.allow_zero_data_retention === "boolean"
      ? config.allow_zero_data_retention
      : false,
  enable_model_fallback:
    typeof config.enable_model_fallback === "boolean"
      ? config.enable_model_fallback
      : true,
  parallel_tool_calls:
    typeof config.parallel_tool_calls === "boolean" ? config.parallel_tool_calls : true,
});

export const CortecsChatConfigForm = ({
  config,
  updateConfig,
}: {
  config: Partial<CortecsChatConfig>;
  updateConfig: (config: CortecsChatConfig) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const normalizedConfig = normalizeCortecsChatConfig(config);
  const preferenceOptions = CORTECS_PREFERENCES.map((value) => ({
    value,
    label: t(`cortecs.preferences.${value}`),
  }));

  const update = (nextConfig: Partial<CortecsChatConfig>) =>
    updateConfig(normalizeCortecsChatConfig(nextConfig));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("cortecs.routing")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Select
            label={t("cortecs.preference")}
            values={[normalizedConfig.preference]}
            valueTitle={
              preferenceOptions.find((option) => option.value === normalizedConfig.preference)
                ?.label
            }
            options={preferenceOptions}
            onChange={(preference: string) =>
              update({ ...normalizedConfig, preference: preference as CortecsPreference })
            }
          >
            {preferenceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </theme.Select>

          <theme.Switch
            id="cortecs_eu_native"
            label={t("cortecs.euNative")}
            checked={normalizedConfig.eu_native}
            onChange={(eu_native) => update({ ...normalizedConfig, eu_native })}
          />
          <theme.Switch
            id="cortecs_allow_zero_data_retention"
            label={t("cortecs.allowZeroDataRetention")}
            checked={normalizedConfig.allow_zero_data_retention}
            onChange={(allow_zero_data_retention) =>
              update({ ...normalizedConfig, allow_zero_data_retention })
            }
          />
          <theme.Switch
            id="cortecs_enable_model_fallback"
            label={t("cortecs.enableModelFallback")}
            checked={normalizedConfig.enable_model_fallback}
            onChange={(enable_model_fallback) =>
              update({ ...normalizedConfig, enable_model_fallback })
            }
          />
          <theme.Switch
            id="cortecs_parallel_tool_calls"
            label={t("parallelToolCalls")}
            checked={normalizedConfig.parallel_tool_calls}
            onChange={(parallel_tool_calls) =>
              update({ ...normalizedConfig, parallel_tool_calls })
            }
          />
        </div>
      </theme.Card>
    </div>
  );
};
