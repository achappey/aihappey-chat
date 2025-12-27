import { useTheme } from "../../../theme/ThemeContext";

const EFFORTS = ["low", "medium", "high"] as const;
type Effort = (typeof EFFORTS)[number];

export type GroqChatConfigFormTranslations = {
  reasoning?: string;
  reasoningEffort?: string;
  webSearch?: string;
  code_execution?: string;
  parallelToolCalls?: string;
  instructionsLabel?: string;
  instructionsPlaceholder?: string;
  low?: string;
  medium?: string;
  high?: string;
};

export type GroqChatConfigFormProps = {
  config: any;
  updateConfig: (val: any) => void;
  translations?: GroqChatConfigFormTranslations;
};

const DEFAULT_REASONING = {
  effort: "medium",
};

const DEFAULT_CODE_INTERPRETER = {
  type: "code_interpreter",
  container: {
    type: "auto",
  },
};

const DEFAULT_BROWSER_SEARCH = {
  type: "browser_search",
};

export const GroqChatConfigForm = ({
  config,
  updateConfig,
  translations,
}: GroqChatConfigFormProps) => {
  const theme = useTheme();

  const reasoningOn = !!config?.reasoning;
  const browserSearchOn = !!config?.browser_search;
  const codeInterpreterOn = !!config?.code_interpreter;

  const effortToIndex = (e?: Effort) =>
    Math.max(0, EFFORTS.indexOf((e ?? "medium") as Effort));

  const indexToEffort = (i: number): Effort =>
    EFFORTS[Math.min(EFFORTS.length - 1, Math.max(0, i))];

  const tEffort = (e: string) => {
    return (translations as any)?.[e] ?? e;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card
        size="small"
        title={translations?.reasoning ?? "reasoning"}
        headerActions={
          <theme.Switch
            id="reasoning"
            checked={reasoningOn}
            onChange={() => {
              updateConfig({
                ...config,
                reasoning: reasoningOn ? undefined : { ...DEFAULT_REASONING },
              });
            }}
          />
        }
      >
        <div style={{ display: "flex", flexDirection: "row" }}>
          <theme.Slider
            label={`${translations?.reasoningEffort ?? "reasoningEffort"} (${tEffort(
              config?.reasoning?.effort ?? "medium"
            )})`}
            disabled={!reasoningOn}
            min={0}
            max={EFFORTS.length - 1}
            step={1}
            style={{ flex: "1 1 0" }}
            value={effortToIndex(config?.reasoning?.effort as Effort)}
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
        title={translations?.webSearch ?? "webSearch"}
        headerActions={
          <theme.Switch
            id="webSearch"
            checked={browserSearchOn}
            onChange={(val) => {
              updateConfig({
                ...config,
                browser_search: !val ? undefined : { ...DEFAULT_BROWSER_SEARCH },
              });
            }}
          />
        }
      />

      <theme.Card
        size="small"
        title={translations?.code_execution ?? "code_execution"}
        headerActions={
          <theme.Switch
            id="codeInterpreter"
            checked={codeInterpreterOn}
            onChange={(val) =>
              updateConfig({
                ...config,
                code_interpreter: !val ? undefined : { ...DEFAULT_CODE_INTERPRETER },
              })
            }
          />
        }
      />

      <theme.Switch
        id="parallelToolCalls"
        checked={!!config?.parallel_tool_calls}
        label={translations?.parallelToolCalls ?? "parallelToolCalls"}
        onChange={(value) => {
          updateConfig({
            ...config,
            parallel_tool_calls: value,
          });
        }}
      />

      <theme.TextArea
        label={translations?.instructionsLabel ?? "instructions"}
        placeholder={translations?.instructionsPlaceholder ?? "instructions"}
        rows={5}
        value={config?.instructions}
        onChange={(value) => {
          updateConfig({
            ...config,
            instructions: value,
          });
        }}
      />
    </div>
  );
};

