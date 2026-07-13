import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

const DEFAULT_REASONING = {
  effort: "medium",
  context: "auto",
  mode: "standard",
  summary: "auto",
};

const EFFORTS = ["none", "minimal", "low", "medium", "high", "xhigh", "max"] as const;
type Effort = (typeof EFFORTS)[number];

export const OpenAIReasoningForm = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const reasoningOn = !!config?.reasoning;

  const summaryOptions = [
    { value: "auto", label: t("auto") },
    { value: "concise", label: t("concise") },
    { value: "detailed", label: t("detailed") },
  ];

  const contextOptions = [
    { value: "auto", label: t("auto") },
    { value: "current_turn", label: t("current_turn") },
    { value: "all_turns", label: t("all_turns") },
  ];

  const modeOptions = [
    { value: "standard", label: t("standard") },
    { value: "pro", label: t("pro") },
  ];

  const effortToIndex = (e?: Effort) =>
    Math.max(0, EFFORTS.indexOf((e ?? "none") as Effort));

  const indexToEffort = (i: number): Effort =>
    EFFORTS[Math.min(EFFORTS.length - 1, Math.max(0, i))];

  const toggleInclude = (key: string, enabled: boolean) => {
    const current = Array.isArray(config?.include) ? config.include : [];
    const next = enabled
      ? Array.from(new Set([...current, key]))
      : current.filter((a: any) => a !== key);

    updateConfig({
      ...config,
      include: next.length ? next : undefined,
    });
  };

  return (
    <theme.Card
      size="small"
      title={t("reasoning")}
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
      <div>
        <div style={{ display: "flex", flexDirection: "row" }}>
          <theme.Slider
            label={`${t("reasoningEffort", {
              reasoningEffort: t(config?.reasoning?.effort),
            })}`}
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
                  ...(config.reasoning ?? { ...DEFAULT_REASONING }),
                  effort: indexToEffort(i),
                },
              })
            }
          />

          <theme.Select
            label={t("reasoningSummary")}
            style={{ flex: "1 1 0" }}
            values={[config?.reasoning?.summary || ""]}
            disabled={!reasoningOn}
            valueTitle={
              summaryOptions.find((a) => a.value === config?.reasoning?.summary)
                ?.label
            }
            options={summaryOptions}
            onChange={(val: string) =>
              updateConfig({
                ...config,
                reasoning: {
                  ...(config.reasoning ?? { ...DEFAULT_REASONING }),
                  summary: val,
                },
              })
            }
          >
            {summaryOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>
        </div>

        <div style={{ display: "flex", flexDirection: "row", marginTop: 6, marginBottom: 6 }}>
          <theme.Select
            label={t("reasoningContext")}
            style={{ flex: "1 1 0" }}
            values={[config?.reasoning?.context || ""]}
            disabled={!reasoningOn}
            valueTitle={
              contextOptions.find((a) => a.value === config?.reasoning?.context)
                ?.label
            }
            options={contextOptions}
            onChange={(val: string) =>
              updateConfig({
                ...config,
                reasoning: {
                  ...(config.reasoning ?? { ...DEFAULT_REASONING }),
                  context: val,
                },
              })
            }
          >
            {contextOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>

          <theme.Select
            label={t("reasoningMode")}
            style={{ flex: "1 1 0" }}
            values={[config?.reasoning?.mode || ""]}
            disabled={!reasoningOn}
            valueTitle={
              modeOptions.find((a) => a.value === config?.reasoning?.mode)
                ?.label
            }
            options={modeOptions}
            onChange={(val: string) =>
              updateConfig({
                ...config,
                reasoning: {
                  ...(config.reasoning ?? { ...DEFAULT_REASONING }),
                  mode: val,
                },
              })
            }
          >
            {modeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>
        </div>

        <theme.Switch
          id="encryptedContent"
          disabled={!reasoningOn}
          checked={config?.include?.includes("reasoning.encrypted_content")}
          label={t("providers:openai.encryptedContent")}
          onChange={(value) =>
            toggleInclude("reasoning.encrypted_content", !!value)
          }
        />
      </div>
    </theme.Card>
  );
};

