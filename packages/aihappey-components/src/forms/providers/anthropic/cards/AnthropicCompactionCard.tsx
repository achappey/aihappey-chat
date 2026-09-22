import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";

export const AnthropicCompactionCard = ({
  config,
  disabled = false,
  updateConfig,
}: {
  config: any;
  disabled?: boolean;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <theme.Card
      size="small"
      title={t("providers:anthropic.compaction.title")}
      headerActions={
        <theme.Switch
          id="anthropic-compaction"
          checked={config?.compaction?.type === "summarize"}
          disabled={disabled}
          onChange={(checked: boolean) =>
            updateConfig({
              ...config,
              compaction: checked ? { type: "summarize" } : undefined,
            })
          }
        />
      }
    />
  );
};
