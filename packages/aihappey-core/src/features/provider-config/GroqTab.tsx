import { useTranslation } from "aihappey-i18n";
import { useTheme } from "aihappey-components";

const DEFAULT_REASONING = {
  effort: "medium"
};

const DEFAULT_CODE_INTERPRETER = {
  type: "code_interpreter",
  container: {
    type: "auto",
  }
};

const DEFAULT_BROWSER_SEARCH = {
  type: "browser_search",
};

const EFFORTS = ["low", "medium", "high"] as const;
type Effort = (typeof EFFORTS)[number];

export const GroqTab = ({
  groq,
  updateGroq,
}: {
  groq: any;
  updateGroq: (val: any) => void;
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  // Reasoning block on/off
  const reasoningOn = !!groq.reasoning;
  const browserSearchOn = !!groq.browser_search;
  const codeInterpreterOn = !!groq.code_interpreter;
  const effortToIndex = (e?: Effort) =>
    Math.max(0, EFFORTS.indexOf((e ?? "medium") as Effort));

  const indexToEffort = (i: number): Effort =>
    EFFORTS[Math.min(EFFORTS.length - 1, Math.max(0, i))];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      <theme.Card
        size="small"
        title={t("reasoning")}
        headerActions={
          <theme.Switch
            id="reasoning"
            checked={reasoningOn}
            onChange={() => {
              updateGroq({
                ...groq,
                reasoning: reasoningOn ? undefined : { ...DEFAULT_REASONING },
              });
            }}
          />
        }
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
          }}
        >
          <theme.Slider
            label={`${t("reasoningEffort")} (${t(
              groq.reasoning?.effort ?? "medium"
            )})`}
            disabled={!reasoningOn}
            min={0}
            max={EFFORTS.length - 1}
            step={1}
            style={{ flex: "1 1 0" }}
            value={effortToIndex(groq.reasoning?.effort as Effort)}
            onChange={(i: number) =>
              updateGroq({
                ...groq,
                reasoning: {
                  ...groq.reasoning,
                  effort: indexToEffort(i), // <-- slaat 'minimal'/'low'/'medium'/'high' op
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
            onChange={(val) => {
              updateGroq({
                ...groq,
                browser_search: !val
                  ? undefined
                  : { ...DEFAULT_BROWSER_SEARCH },
              });
            }}
          />
        }
      >
      </theme.Card>

      <theme.Card
        size="small"
        title={t("code_execution")}
        headerActions={
          <theme.Switch
            id="codeInterpreter"
            checked={codeInterpreterOn}
            onChange={(val) =>
              updateGroq({
                ...groq,
                code_interpreter: !val
                  ? undefined
                  : {
                    ...DEFAULT_CODE_INTERPRETER,
                  },
              })
            }
          />
        }
      >

      </theme.Card>

      <theme.Switch
        id="parallelToolCalls"
        checked={groq?.parallel_tool_calls}
        label={t("parallelToolCalls")}
        onChange={(value) => {
          updateGroq({
            ...groq,
            parallel_tool_calls: value,
          });
        }}
      />

      <theme.TextArea
        label={t("openai.instructions")}
        placeholder={t("openai.instructionsPlaceholder")}
        rows={5}
        value={groq?.instructions}
        onChange={(value) => {
          updateGroq({
            ...groq,
            instructions: value,
          });
        }}></theme.TextArea>

    </div>
  );
};
