import React from "react";
import { useTranslation } from "aihappey-i18n";
import type { ModelOption } from "aihappey-types";
import { useTheme } from "../../../../theme/ThemeContext";

const PERPLEXITY_PREFIX = "perplexity/";

export const PerplexityAgentCardForm: React.FC<{
  config: any;
  updateConfig: (val: any) => void;
  models?: ModelOption[];
}> = ({ config, updateConfig, models = [] }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const modelOptions = React.useMemo(
    () =>
      models
        .filter((model) => model?.id?.startsWith(PERPLEXITY_PREFIX)
          && !model?.id?.startsWith(PERPLEXITY_PREFIX + "sonar")
          && model?.id?.split("/").length == 3)
        .map((model) => ({
          value: model.id.slice(PERPLEXITY_PREFIX.length),
          label: model.name || model.id.slice(PERPLEXITY_PREFIX.length),
        })),
    [models],
  );

  const selectedFallbackModels = Array.isArray(config?.models)
    ? config.models.filter((value: any) => typeof value === "string")
    : [];

  const toggleModel = (modelId: string, enabled: boolean) => {
    const current = selectedFallbackModels;
    const next = enabled
      ? Array.from(new Set([...current, modelId]))
      : current.filter((value: any) => value !== modelId);

    updateConfig({
      ...config,
      models: next.length ? next.slice(0, 5) : undefined,
    });
  };

  return (
    <theme.Card size="small" title={t("providers:perplexity.agent")}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <theme.TextArea
          label={t("providers:perplexity.instructions")}
          value={config?.instructions ?? ""}
          rows={5}
          onChange={(e: any) =>
            updateConfig({
              ...config,
              instructions: e.target.value || undefined,
            })
          }
        />

        <theme.Input
          label={t("providers:perplexity.languagePreference")}
          placeholder={t("providers:perplexity.languagePreferencePlaceholder")}
          value={config?.language_preference ?? ""}
          onChange={(e: any) =>
            updateConfig({
              ...config,
              language_preference: e.target.value || undefined,
            })
          }
        />

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <theme.Input
            label={t("providers:perplexity.maxSteps")}
            type="number"
            min={1}
            max={10}
            value={config?.max_steps ?? ""}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                max_steps: e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div>{t("providers:perplexity.models")}</div>
          {modelOptions.length ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 8,
                alignItems: "start",
              }}
            >
              {modelOptions.map((option) => (
                <theme.Switch
                  key={option.value}
                  id={`perplexityAgentModel_${option.value}`}
                  label={option.label}
                  checked={selectedFallbackModels.includes(option.value)}
                  onChange={(enabled) => toggleModel(option.value, !!enabled)}
                />
              ))}
            </div>
          ) : (
            <div>{t("providers:perplexity.noModelsAvailable")}</div>
          )}
        </div>
      </div>
    </theme.Card>
  );
};
