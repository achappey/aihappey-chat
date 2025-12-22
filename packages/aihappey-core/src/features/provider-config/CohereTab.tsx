import { useTranslation } from "aihappey-i18n";
import { useTheme } from "aihappey-components";

// --- Defaults ---
const DEFAULT_THINKING = {
  token_budget: 2048,
};

const DEFAULT_CITATIONS = {
  mode: "enabled",
};

export const CohereTab = ({
  cohere,
  updateCohere,
}: {
  cohere: any;
  updateCohere: (val: any) => void;
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const thinkingOn = !!cohere.thinking;
  const citationsOn = !!cohere.citation_options;

  const citationOptions = [
    { value: "enabled", label: t("enabled") },
    { value: "disabled", label: t("disabled") },
    { value: "fast", label: t("fast") },
    { value: "accurate", label: t("accurate") },
    { value: "off", label: t("off") }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card
        size="small"
        title={t("reasoning")}
        headerActions={
          <theme.Switch
            id="thinking"
            checked={thinkingOn}
            onChange={(val) =>
              updateCohere({
                ...cohere,
                thinking: !val ? undefined : { ...DEFAULT_THINKING },
              })
            }
          />
        }
      >
        <div>
          <theme.Input
            type="number"
            label={t("budget")}
            disabled={!thinkingOn}
            value={cohere.thinking?.token_budget ?? ""}
            onChange={(e: any) =>
              updateCohere({
                ...cohere,
                thinking: {
                  ...cohere.thinking,
                  token_budget: parseInt(e.target.value, 10),
                },
              })
            }
          />
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={t("cohere.citationOptions")}
        headerActions={
          <theme.Switch
            id="webSearch"
            checked={citationsOn}
            onChange={(val) =>
              updateCohere({
                ...cohere,
                citation_options: !val ? undefined : { ...DEFAULT_CITATIONS },
              })
            }
          />
        }
      >
        <div>
          <theme.Select
            label={t("mode")}
            values={[cohere.citation_options?.mode ?? ""]}
            disabled={!citationsOn}
            valueTitle={
              citationOptions.find((a) => a.value === cohere.citation_options?.mode)
                ?.label
            }
            options={citationOptions}
            onChange={(val: string) =>
              updateCohere({
                ...cohere,
                citation_options: {
                  ...cohere.citation_options,
                  mode: val,
                },
              })
            }
          >
            {citationOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>
        </div>
      </theme.Card>
    </div>
  );
};
