import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import {
  buildCanonicalProviderToolsConfig,
  withResolvedProviderTools,
} from "../providerToolConfig";

const EFFORTS = ["low", "medium", "high"] as const;
type Effort = (typeof EFFORTS)[number];

const DEFAULT_REASONING = {
  effort: "medium" as Effort,
};

const DEFAULT_CODE_INTERPRETER = {
  type: "code_interpreter",
  container: { type: "auto" },
};

const DEFAULT_BROWSER_SEARCH = {
  type: "browser_search",
};

const GROQ_TOOL_TYPES = ["browser_search", "code_interpreter"];

export const GroqChatConfigForm = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const resolvedConfig = withResolvedProviderTools(config, GROQ_TOOL_TYPES);
  const submitConfig = (nextConfig: any) =>
    updateConfig(buildCanonicalProviderToolsConfig(nextConfig, GROQ_TOOL_TYPES));

  const reasoningOn = !!config?.reasoning;
  const browserSearchOn = !!resolvedConfig?.browser_search;
  const codeInterpreterOn = !!resolvedConfig?.code_interpreter;

  const effortToIndex = (e?: Effort) =>
    Math.max(0, EFFORTS.indexOf((e ?? "medium") as Effort));

  const indexToEffort = (i: number): Effort =>
    EFFORTS[Math.min(EFFORTS.length - 1, Math.max(0, i))];

  const tEffort = (e: Effort) => t(e);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card
        size="small"
        title={t("reasoning")}
        headerActions={
          <theme.Switch
            id="reasoning"
            checked={reasoningOn}
            onChange={() =>
              updateConfig({
                ...config,
                reasoning: reasoningOn ? undefined : { ...DEFAULT_REASONING },
              })
            }
          />
        }
      >
        <div>
          <theme.Slider
            label={`${t("reasoningEffort", {
              reasoningEffort: t(config?.reasoning?.effort ?? "none")
            })}`}
            disabled={!reasoningOn}
            min={0}
            max={EFFORTS.length - 1}
            step={1}
            value={effortToIndex(config?.reasoning?.effort)}
            onChange={(i: number) =>
              updateConfig({
                ...config,
                reasoning: {
                  ...(config?.reasoning ?? DEFAULT_REASONING),
                  effort: indexToEffort(i),
                },
              })
            }
          />
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={t("webSearch")}
        headerActions={
          <theme.Switch
             id="webSearch"
             checked={browserSearchOn}
             onChange={(val) =>
              submitConfig({
                ...resolvedConfig,
                browser_search: !val ? undefined : { ...DEFAULT_BROWSER_SEARCH },
              })
            }
          />
        }
      />

      <theme.Card
        size="small"
        title={t("code_execution")}
        headerActions={
          <theme.Switch
            id="codeInterpreter"
            checked={codeInterpreterOn}
            onChange={(val) =>
              submitConfig({
                ...resolvedConfig,
                code_interpreter: !val
                  ? undefined
                  : { ...DEFAULT_CODE_INTERPRETER },
              })
            }
          />
        }
      />

      <theme.Switch
        id="parallelToolCalls"
        checked={!!config?.parallel_tool_calls}
        label={t("parallelToolCalls")}
        onChange={(value) =>
          updateConfig({
            ...config,
            parallel_tool_calls: value,
          })
        }
      />

      <theme.TextArea
        label={t("providers:openai.instructions")}
        placeholder={t("providers:openai.instructionsPlaceholder")}
        rows={5}
        value={config?.instructions}
        onChange={(value) =>
          updateConfig({
            ...config,
            instructions: value,
          })
        }
      />
    </div>
  );
};
