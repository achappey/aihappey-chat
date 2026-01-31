import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";

const DEFAULT_THINKING = {
  budget_tokens: 16768,
};

export const AnthropicReasoningCard = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const thinkingOn = !!config?.thinking;

  return (
    <theme.Card
      size="small"
      title={t("reasoning")}
      headerActions={
        <theme.Switch
          id="thinking"
          checked={thinkingOn}
          onChange={() =>
            updateConfig({
              ...config,
              thinking: thinkingOn ? undefined : { ...DEFAULT_THINKING },
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
          value={config?.thinking?.budget_tokens ?? ""}
          onChange={(e: any) =>
            updateConfig({
              ...config,
              thinking: {
                ...config.thinking,
                budget_tokens: parseInt(e.target.value, 10),
              },
            })
          }
        />
      </div>
    </theme.Card>
  );
};
