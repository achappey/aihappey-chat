import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";
import {
  ANTHROPIC_CACHE_CONTROL_TTLS,
  createAnthropicCacheControl,
  parseAnthropicNumberInput,
} from "./AnthropicToolCardShared";

const ADVISOR_MODELS = ["claude-opus-5", "claude-opus-4-8", "claude-opus-4-7", "claude-opus-4-6", "claude-sonnet-4-6"];

const createDefaultAdvisorTool = () => ({
  type: "advisor_20260301",
  name: "advisor",
  model: ADVISOR_MODELS[0],
});

export const AnthropicAdvisorCard = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const advisorOn = !!config?.advisor;
  const tool = config?.advisor ?? createDefaultAdvisorTool();

  return (
    <theme.Card
      size="small"
      title={t("providers:anthropic.advisor.title")}
      headerActions={
        <theme.Switch
          id="anthropic-advisor"
          checked={advisorOn}
          onChange={(checked: boolean) =>
            updateConfig({
              ...config,
              advisor: checked ? createDefaultAdvisorTool() : undefined,
            })
          }
        />
      }
    >
      <div style={{ display: "flex", flexDirection: "column" }}>

        <theme.Select
          label={t("providers:anthropic.advisor.model")}
          disabled={!advisorOn}
          values={[tool?.model ?? ADVISOR_MODELS[0]]}
          valueTitle={tool?.model ?? ADVISOR_MODELS[0]}
          onChange={(value: string) =>
            updateConfig({
              ...config,
              advisor: {
                ...tool,
                type: "advisor_20260301",
                name: "advisor",
                model: value,
              },
            })
          }
        >
          {ADVISOR_MODELS.map((value) => (
            <option key={`anthropic-advisor-model-${value}`} value={value}>
              {value}
            </option>
          ))}
        </theme.Select>

        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            width: "100%",
          }}
        >
          <theme.Input
            type="number"
            min={1}
            step={1}
            label={t("providers:anthropic.maxUses")}
            disabled={!advisorOn}
            value={tool?.max_uses ?? ""}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                advisor: {
                  ...tool,
                  type: "advisor_20260301",
                  name: "advisor",
                  max_uses: parseAnthropicNumberInput(e.target.value),
                },
              })
            }
          />

          <theme.Input
            type="number"
            min={1024}
            step={1}
            label={t("providers:anthropic.advisor.maxTokens")}
            disabled={!advisorOn}
            value={tool?.max_tokens ?? ""}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                advisor: {
                  ...tool,
                  type: "advisor_20260301",
                  name: "advisor",
                  max_tokens: parseAnthropicNumberInput(e.target.value),
                },
              })
            }
          />
        </div>

        <theme.Switch
          id="anthropic-advisor-caching"
          label={t("providers:anthropic.advisor.caching")}
          size="small"
          disabled={!advisorOn}
          checked={!!tool?.caching}
          onChange={(checked: boolean) =>
            updateConfig({
              ...config,
              advisor: {
                ...tool,
                type: "advisor_20260301",
                name: "advisor",
                caching: checked
                  ? createAnthropicCacheControl(tool?.caching?.ttl)
                  : undefined,
              },
            })
          }
        />

        {tool?.caching ? (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 220px", minWidth: 220 }}>
              <theme.Select
                label={t("providers:anthropic.cacheControlType")}
                disabled={!advisorOn}
                values={[tool?.caching?.type ?? "ephemeral"]}
                valueTitle={t("providers:anthropic.ephemeral")}
                onChange={() =>
                  updateConfig({
                    ...config,
                    advisor: {
                      ...tool,
                      type: "advisor_20260301",
                      name: "advisor",
                      caching: createAnthropicCacheControl(tool?.caching?.ttl),
                    },
                  })
                }
              >
                <option value="ephemeral">{t("providers:anthropic.ephemeral")}</option>
              </theme.Select>
            </div>

            <div style={{ flex: "1 1 220px", minWidth: 220 }}>
              <theme.Select
                label={t("providers:anthropic.cacheDuration")}
                disabled={!advisorOn}
                values={[tool?.caching?.ttl ?? ""]}
                valueTitle={tool?.caching?.ttl ?? t("providers:anthropic.defaultOption")}
                onChange={(value: string) =>
                  updateConfig({
                    ...config,
                    advisor: {
                      ...tool,
                      type: "advisor_20260301",
                      name: "advisor",
                      caching: {
                        type: "ephemeral",
                        ttl: value || undefined,
                      },
                    },
                  })
                }
              >
                <option value="">{t("providers:anthropic.defaultOption")}</option>
                {ANTHROPIC_CACHE_CONTROL_TTLS.map((value) => (
                  <option key={`anthropic-advisor-cache-ttl-${value}`} value={value}>
                    {value}
                  </option>
                ))}
              </theme.Select>
            </div>
          </div>
        ) : null}
      </div>
    </theme.Card>
  );
};

