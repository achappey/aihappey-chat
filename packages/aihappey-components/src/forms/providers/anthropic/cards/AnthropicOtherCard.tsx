import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";

const DEFAULT_VALUE = "";
const SERVICE_TIER_OPTIONS = [DEFAULT_VALUE, "auto", "standard_only"] as const;
const INFERENCE_GEO_OPTIONS = [DEFAULT_VALUE, "global", "us"] as const;

export const AnthropicOtherCard = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (config: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const serviceTierValue = SERVICE_TIER_OPTIONS.includes(config?.service_tier)
    ? config.service_tier
    : DEFAULT_VALUE;
  const inferenceGeoValue = INFERENCE_GEO_OPTIONS.includes(config?.inference_geo)
    ? config.inference_geo
    : DEFAULT_VALUE;

  const updateOptionalProperty = (
    property: "service_tier" | "inference_geo",
    value: string,
  ) => {
    const nextConfig = { ...(config ?? {}) };

    if (value === DEFAULT_VALUE) {
      delete nextConfig[property];
    } else {
      nextConfig[property] = value;
    }

    updateConfig(nextConfig);
  };

  const serviceTierOptions = SERVICE_TIER_OPTIONS.map((value) => ({
    value,
    label: value
      ? t(`providers:anthropic.other.serviceTier.options.${value}`)
      : t("providerDefault"),
  }));
  const inferenceGeoOptions = INFERENCE_GEO_OPTIONS.map((value) => ({
    value,
    label: value
      ? t(`providers:anthropic.other.inferenceGeo.options.${value}`)
      : t("providerDefault"),
  }));

  return (
    <theme.Card size="small" title={t("other")}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <theme.Select
          label={t("providers:anthropic.other.serviceTier.title")}
          values={[serviceTierValue]}
          valueTitle={
            serviceTierOptions.find((option) => option.value === serviceTierValue)
              ?.label ?? t("providerDefault")
          }
          options={serviceTierOptions}
          onChange={(value: string) =>
            updateOptionalProperty("service_tier", String(value ?? DEFAULT_VALUE))
          }
        >
          {serviceTierOptions.map((option) => (
            <option key={option.value || "default"} value={option.value}>
              {option.label}
            </option>
          ))}
        </theme.Select>

        <theme.Select
          label={t("providers:anthropic.other.inferenceGeo.title")}
          values={[inferenceGeoValue]}
          valueTitle={
            inferenceGeoOptions.find((option) => option.value === inferenceGeoValue)
              ?.label ?? t("providerDefault")
          }
          options={inferenceGeoOptions}
          onChange={(value: string) =>
            updateOptionalProperty("inference_geo", String(value ?? DEFAULT_VALUE))
          }
        >
          {inferenceGeoOptions.map((option) => (
            <option key={option.value || "default"} value={option.value}>
              {option.label}
            </option>
          ))}
        </theme.Select>
      </div>
    </theme.Card>
  );
};
