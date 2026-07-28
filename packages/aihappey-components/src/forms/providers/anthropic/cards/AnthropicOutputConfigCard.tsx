import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";

const EFFORTS = ["low", "medium", "high", "xhigh", "max"] as const;
type Effort = (typeof EFFORTS)[number];

const effortToIndex = (effort?: Effort) =>
  Math.max(0, EFFORTS.indexOf((effort ?? "medium") as Effort));

const indexToEffort = (index: number): Effort =>
  EFFORTS[Math.min(EFFORTS.length - 1, Math.max(0, index))];

export const AnthropicOutputConfigCard = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const effort = (config?.output_config?.effort ?? "medium") as Effort;

  return (
    <theme.Card size="small" title={t("providers:anthropic.outputConfig.title")}>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <theme.Slider
          label={t("providers:anthropic.outputConfig.effort", {
            effort: t(effort),
          })}
          min={0}
          max={EFFORTS.length - 1}
          step={1}
          style={{ flex: "1 1 0" }}
          value={effortToIndex(effort)}
          onChange={(index: number) =>
            updateConfig({
              ...config,
              output_config: {
                ...(config?.output_config ?? {}),
                effort: indexToEffort(index),
              },
            })
          }
        />
      </div>
    </theme.Card>
  );
};
