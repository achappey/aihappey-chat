import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";
import { parseAnthropicNumberInput } from "./AnthropicToolCardShared";

const THINKING_DISPLAY_OPTIONS = ["summarized", "omitted", "updates"] as const;
const THINKING_MODE_OPTIONS = ["enabled", "disabled", "between_tools", "adaptive"] as const;
const PREFIX_MISMATCH_BEHAVIOR_OPTIONS = ["error", "drop_block"] as const;

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
  const supportsBlockBinding = isEnabledMode || thinkingType === "adaptive";
  const prefixMismatchBehavior = thinking?.block_binding?.prefix_mismatch_behavior ?? "";

  const updatePrefixMismatchBehavior = (value: string) => {
    const { prefix_mismatch_behavior: _previous, ...remainingBlockBinding } =
      thinking?.block_binding ?? {};
    const blockBinding = value
      ? { ...remainingBlockBinding, prefix_mismatch_behavior: value }
      : remainingBlockBinding;

    updateConfig({
      ...config,
      thinking: {
        ...thinking,
        block_binding: Object.keys(blockBinding).length ? blockBinding : undefined,
      },
    });
  };

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
      <div style={{ display: "flex", flexDirection: "column" }}>
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
                  ? {
                    ...createDefaultThinking(),
                    ...(thinking?.block_binding != null
                      ? { block_binding: thinking.block_binding }
                      : {}),
                  }
                  : {
                    type: value,
                    ...(value === "adaptive"
                      ? {
                        display: thinkingDisplay,
                        ...(thinking?.block_binding != null
                          ? { block_binding: thinking.block_binding }
                          : {}),
                      }
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

        {supportsBlockBinding ? (
          <div style={{ display: "flex", gap: 12, width: "100%" }}>
            <theme.Select
              label={t("providers:anthropic.thinkingDisplay")}
              disabled={!thinkingOn}
              values={[thinkingDisplay]}
              style={{ flex: "1 1 0", minWidth: 0 }}
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

            <theme.Select
              label={t("providers:anthropic.prefixMismatchBehavior")}
              disabled={!thinkingOn}
              values={[prefixMismatchBehavior]}
              style={{ flex: "1 1 0", minWidth: 0 }}
              valueTitle={
                prefixMismatchBehavior
                  ? t(`providers:anthropic.prefixMismatchBehaviorOptions.${prefixMismatchBehavior}`)
                  : t("providers:anthropic.defaultOption")
              }
              onChange={updatePrefixMismatchBehavior}
            >
              <option value="">{t("providers:anthropic.defaultOption")}</option>
              {PREFIX_MISMATCH_BEHAVIOR_OPTIONS.map((value) => (
                <option key={`anthropic-prefix-mismatch-${value}`} value={value}>
                  {t(`providers:anthropic.prefixMismatchBehaviorOptions.${value}`)}
                </option>
              ))}
            </theme.Select>
          </div>
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
