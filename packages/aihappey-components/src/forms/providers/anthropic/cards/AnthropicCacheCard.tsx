import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";

const CACHE_TTL_OPTIONS = ["5m", "1h"] as const;

const createCacheControl = (ttl: string = "5m") =>
  ttl === "1h" ? { type: "ephemeral", ttl: "1h" } : { type: "ephemeral" };

export const AnthropicCacheCard = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const cacheOn = !!config?.cache_control;
  const cacheTtl = config?.cache_control?.ttl === "1h" ? "1h" : "5m";

  return (
    <theme.Card
      size="small"
      title={t("providers:anthropic.cache.title")}
      headerActions={
        <theme.Switch
          id="anthropic-cache-control"
          checked={cacheOn}
          onChange={(checked: boolean) =>
            updateConfig({
              ...config,
              cache_control: checked ? createCacheControl() : undefined,
            })
          }
        />
      }
    >
      <theme.Select
        label={t("providers:anthropic.cache.ttl")}
        disabled={!cacheOn}
        values={[cacheTtl]}
        valueTitle={t(`providers:anthropic.cache.ttlOptions.${cacheTtl}`)}
        onChange={(value: string) =>
          updateConfig({
            ...config,
            cache_control: createCacheControl(value),
          })
        }
      >
        {CACHE_TTL_OPTIONS.map((value) => (
          <option key={`anthropic-cache-ttl-${value}`} value={value}>
            {t(`providers:anthropic.cache.ttlOptions.${value}`)}
          </option>
        ))}
      </theme.Select>
    </theme.Card>
  );
};

