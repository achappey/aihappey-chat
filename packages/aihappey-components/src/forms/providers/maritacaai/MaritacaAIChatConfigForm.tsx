import { useMemo } from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../theme/ThemeContext";
import {
  buildCanonicalProviderToolsConfig,
  withResolvedProviderTools,
} from "../providerToolConfig";

const MARITACAAI_TOOL_TYPES = [
  "web_search",
  "code_interpreter",
  "data_ocean",
] as const;

const SERVICE_TIER_OPTIONS = [
  { value: "", label: "Standard" },
  { value: "flex", label: "Flex" },
] as const;

type MaritacaAIToolType = (typeof MARITACAAI_TOOL_TYPES)[number];

export const MaritacaAIChatConfigForm = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const resolvedConfig = useMemo(
    () => withResolvedProviderTools(config, MARITACAAI_TOOL_TYPES as any),
    [config],
  );
  const serviceTierValue = config?.service_tier === "flex" ? "flex" : "";

  const submitConfig = (nextConfig: any) =>
    updateConfig(
      buildCanonicalProviderToolsConfig(nextConfig, MARITACAAI_TOOL_TYPES as any),
    );

  const toggleTool = (type: MaritacaAIToolType, enabled: boolean) => {
    submitConfig({
      ...resolvedConfig,
      [type]: enabled ? { type } : undefined,
    });
  };

  const toolCards: Array<{ type: MaritacaAIToolType; title: string; id: string }> = [
    { type: "web_search", title: t("webSearch"), id: "maritacaaiWebSearchTool" },
    {
      type: "code_interpreter",
      title: t("providers:maritacaai.codeExecution", "Code execution"),
      id: "maritacaaiCodeInterpreterTool",
    },
    {
      type: "data_ocean",
      title: t("providers:maritacaai.dataOcean", "Data Ocean"),
      id: "maritacaaiDataOceanTool",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {toolCards.map(({ type, title, id }) => (
        <theme.Card
          key={type}
          size="small"
          title={title}
          headerActions={
            <theme.Switch
              id={id}
              checked={!!resolvedConfig[type]}
              onChange={(enabled) => toggleTool(type, enabled)}
            />
          }
        />
      ))}

      <theme.Card size="small" title={t("other")}>
        <theme.Select
          label={t("providers:maritacaai.serviceTier", "Service tier")}
          values={[serviceTierValue]}
          valueTitle={
            SERVICE_TIER_OPTIONS.find((option) => option.value === serviceTierValue)
              ?.label ?? "Standard"
          }
          options={SERVICE_TIER_OPTIONS.map((option) => ({
            ...option,
            label: t(`providers:maritacaai.serviceTierOptions.${option.value || "standard"}`, option.label),
          }))}
          onChange={(value: string) =>
            submitConfig({
              ...resolvedConfig,
              service_tier: value === "flex" ? "flex" : undefined,
            })
          }
        >
          {SERVICE_TIER_OPTIONS.map((option) => (
            <option key={option.value || "standard"} value={option.value}>
              {t(`providers:maritacaai.serviceTierOptions.${option.value || "standard"}`, option.label)}
            </option>
          ))}
        </theme.Select>
      </theme.Card>
    </div>
  );
};
