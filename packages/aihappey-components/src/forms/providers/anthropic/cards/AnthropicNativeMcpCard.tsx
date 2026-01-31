import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";

export const AnthropicNativeMcpCard = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const nativeMcpOn = !!config?.native_mcp;

  return (
    <theme.Card
      size="small"
      title={t("nativeMcp")}
      headerActions={
        <theme.Switch
          id="nativeMcp"
          checked={nativeMcpOn}
          onChange={(val) =>
            updateConfig({
              ...config,
              native_mcp: val,
            })
          }
        />
      }
    />
  );
};
