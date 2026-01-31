import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";

export const AnthropicMemoryCard = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <theme.Card
      size="small"
      title={t("memory")}
      headerActions={
        <theme.Switch
          id="memory"
          checked={config?.memory !== undefined}
          onChange={(val) =>
            updateConfig({
              ...config,
              memory: val ? {} : undefined,
            })
          }
        />
      }
    />
  );
};
