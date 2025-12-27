import { useTheme } from "../../../theme/ThemeContext";

// --- Defaults ---
const DEFAULT_THINKING = {
  token_budget: 2048,
};

const DEFAULT_CITATIONS = {
  mode: "enabled",
};

export type CohereChatConfigFormTranslations = {
  reasoning?: string;
  budget?: string;

  citationOptions?: string;
  mode?: string;

  enabled?: string;
  disabled?: string;
  fast?: string;
  accurate?: string;
  off?: string;
};

export const CohereChatConfigForm = ({
  config,
  updateConfig,
  translations,
}: {
  config: any;
  updateConfig: (val: any) => void;
  translations?: CohereChatConfigFormTranslations;
}) => {
  const theme = useTheme();

  const thinkingOn = !!config?.thinking;
  const citationsOn = !!config?.citation_options;

  const citationOptions = [
    { value: "enabled", label: translations?.enabled ?? "enabled" },
    { value: "disabled", label: translations?.disabled ?? "disabled" },
    { value: "fast", label: translations?.fast ?? "fast" },
    { value: "accurate", label: translations?.accurate ?? "accurate" },
    { value: "off", label: translations?.off ?? "off" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card
        size="small"
        title={translations?.reasoning ?? "reasoning"}
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
            label={translations?.budget ?? "budget"}
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
        title={translations?.citationOptions ?? "citationOptions"}
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
            label={translations?.mode ?? "mode"}
            values={[config?.citation_options?.mode ?? ""]}
            disabled={!citationsOn}
            valueTitle={
              citationOptions.find((a) => a.value === config?.citation_options?.mode)
                ?.label
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
