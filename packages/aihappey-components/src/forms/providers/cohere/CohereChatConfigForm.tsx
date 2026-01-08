import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

// --- Defaults ---
const DEFAULT_THINKING = {
  token_budget: 2048,
};

const DEFAULT_CITATIONS = {
  mode: "enabled",
};

export const CohereChatConfigForm = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const thinkingOn = !!config?.thinking;
  const citationsOn = !!config?.citation_options;

  const citationOptions = [
    { value: "enabled", label: t("enabled") },
    { value: "disabled", label: t("disabled") },
    { value: "fast", label: t("fast") },
    { value: "accurate", label: t("accurate") },
    { value: "off", label: t("off") },
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
              updateConfig({
                ...config,
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
            value={config?.thinking?.token_budget ?? ""}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                thinking: {
                  ...config.thinking,
                  token_budget: parseInt(e.target.value, 10),
                },
              })
            }
          />
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={t("providers:cohere.citationOptions")}
        headerActions={
          <theme.Switch
            id="citationOptions"
            checked={citationsOn}
            onChange={(val) =>
              updateConfig({
                ...config,
                citation_options: !val ? undefined : { ...DEFAULT_CITATIONS },
              })
            }
          />
        }
      >
        <div>
          <theme.Select
            label={t("mode")}
            values={[config?.citation_options?.mode ?? ""]}
            disabled={!citationsOn}
            valueTitle={
              citationOptions.find(
                (a) => a.value === config?.citation_options?.mode
              )?.label
            }
            options={citationOptions}
            onChange={(val: string) =>
              updateConfig({
                ...config,
                citation_options: {
                  ...config.citation_options,
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
