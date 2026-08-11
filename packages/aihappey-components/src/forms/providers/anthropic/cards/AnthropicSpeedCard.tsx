import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";

const SPEED_OPTIONS = ["standard", "fast"] as const;
type AnthropicSpeed = (typeof SPEED_OPTIONS)[number];

const isAnthropicSpeed = (value: unknown): value is AnthropicSpeed =>
  SPEED_OPTIONS.includes(value as AnthropicSpeed);

export const AnthropicSpeedCard = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (config: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const speedOn = isAnthropicSpeed(config?.speed);
  const speedValue: AnthropicSpeed = speedOn ? config.speed : "standard";
  const speedOptions = SPEED_OPTIONS.map((value) => ({
    value,
    label: t(`providers:anthropic.other.speed.options.${value}`),
  }));

  const toggleSpeed = (enabled: boolean) => {
    const nextConfig = { ...(config ?? {}) };

    if (enabled) {
      nextConfig.speed = "standard";
    } else {
      delete nextConfig.speed;
    }

    updateConfig(nextConfig);
  };

  return (
    <theme.Card
      size="small"
      title={t("providers:anthropic.other.speed.title")}
      headerActions={
        <theme.Switch
          id="anthropic-speed"
          checked={speedOn}
          onChange={toggleSpeed}
        />
      }
    >
      <theme.Select
        label={t("providers:anthropic.other.speed.title")}
        disabled={!speedOn}
        values={[speedValue]}
        valueTitle={
          speedOptions.find((option) => option.value === speedValue)?.label
        }
        options={speedOptions}
        onChange={(value: string) => {
          if (isAnthropicSpeed(value)) {
            updateConfig({ ...(config ?? {}), speed: value });
          }
        }}
      >
        {speedOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </theme.Select>
    </theme.Card>
  );
};
