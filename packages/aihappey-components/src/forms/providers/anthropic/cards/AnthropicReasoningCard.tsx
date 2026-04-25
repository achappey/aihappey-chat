import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";
import { parseAnthropicNumberInput } from "./AnthropicToolCardShared";

const THINKING_DISPLAY_OPTIONS = ["summarized", "omitted"] as const;
const THINKING_MODE_OPTIONS = ["enabled", "disabled", "adaptive"] as const;

const DEFAULT_THINKING = {
  type: "enabled",
  budget_tokens: 4096,
  display: "summarized",
} as const;

const createDefaultThinking = () => ({ ...DEFAULT_THINKING });

export const AnthropicReasoningCard = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const thinkingOn = !!config?.thinking;
  const thinking = config?.thinking ?? createDefaultThinking();
  const thinkingType = thinking?.type ?? "enabled";
  const thinkingDisplay = thinking?.display ?? "summarized";
  const isEnabledMode = thinkingType === "enabled";

  return (
    <theme.Card
      size="small"
      title={t("reasoning")}
      headerActions={
        <theme.Switch
          id="thinking"
          checked={thinkingOn}
          onChange={(checked: boolean) =>
            updateConfig({
              ...config,
              thinking: checked ? createDefaultThinking() : undefined,
            })
          }
        />
      }
    >
      <div style={{ display: "flex", flexDirection: "column"}}>
        <theme.Select
          label={t("mode")}
          disabled={!thinkingOn}
          values={[thinkingType]}
          valueTitle={t(`providers:anthropic.thinkingModes.${thinkingType}`)}
          onChange={(value: string) =>
            updateConfig({
              ...config,
              thinking: {
                ...(value === "enabled"
                  ? createDefaultThinking()
                  : {
                      type: value,
                      ...(value === "adaptive"
                        ? { display: thinkingDisplay }
                        : {}),
                    }),
              },
            })
          }
        >
          {THINKING_MODE_OPTIONS.map((value) => (
            <option key={`anthropic-thinking-mode-${value}`} value={value}>
              {t(`providers:anthropic.thinkingModes.${value}`)}
            </option>
          ))}
        </theme.Select>

        {thinkingType !== "disabled" ? (
          <theme.Select
            label={t("providers:anthropic.thinkingDisplay")}
            disabled={!thinkingOn}
            values={[thinkingDisplay]}
            valueTitle={t(`providers:anthropic.thinkingDisplayModes.${thinkingDisplay}`)}
            onChange={(value: string) =>
              updateConfig({
                ...config,
                thinking: {
                  ...thinking,
                  display: value,
                },
              })
            }
          >
            {THINKING_DISPLAY_OPTIONS.map((value) => (
              <option key={`anthropic-thinking-display-${value}`} value={value}>
                {t(`providers:anthropic.thinkingDisplayModes.${value}`)}
              </option>
            ))}
          </theme.Select>
        ) : null}

        {isEnabledMode ? (
          <theme.Input
            type="number"
            label={t("budget")}
            disabled={!thinkingOn}
            value={thinking?.budget_tokens ?? ""}
            min={1024}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                thinking: {
                  ...thinking,
                  type: "enabled",
                  budget_tokens: parseAnthropicNumberInput(e.target.value),
                },
              })
            }
          />
        ) : null}
      </div>
    </theme.Card>
  );
};
