import { useTranslation } from "aihappey-i18n";

import { useTheme } from "../../../../theme/ThemeContext";
import {
  NEURALWATT_SERVICE_TIERS,
  type NeuralwattChatConfigCardProps,
  type NeuralwattServiceTier,
} from "../neuralwattChatConfig";

const PROVIDER_DEFAULT = "";

export const NeuralwattServiceTierCard = ({
  config,
  updateConfig,
}: NeuralwattChatConfigCardProps) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const value = config.service_tier ?? PROVIDER_DEFAULT;
  const options = [
    { value: PROVIDER_DEFAULT, label: t("neuralwatt.serviceTier.providerDefault") },
    ...NEURALWATT_SERVICE_TIERS.map((tier) => ({
      value: tier,
      label: t(`neuralwatt.serviceTier.options.${tier}`),
    })),
  ];

  return (
    <theme.Card size="small" title={t("neuralwatt.serviceTier.title")}>
      <theme.Select
        label={t("neuralwatt.serviceTier.label")}
        values={[value]}
        valueTitle={options.find((option) => option.value === value)?.label}
        options={options}
        onChange={(tier: string) => {
          if (tier === PROVIDER_DEFAULT) {
            const { service_tier: _serviceTier, ...nextConfig } = config;
            updateConfig(nextConfig);
            return;
          }

          updateConfig({ ...config, service_tier: tier as NeuralwattServiceTier });
        }}
      >
        {options.map((option) => (
          <option key={option.value || "provider-default"} value={option.value}>
            {option.label}
          </option>
        ))}
      </theme.Select>
    </theme.Card>
  );
};
