import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

const DEFAULT_FILE_SEARCH = {
  max_num_results: 10,
  vector_store_ids: [] as string[], // must be array (UI treats it as array)
};

export const OpenAIFileSearchForm = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const fileSearchOn = !!config?.file_search;

  const toggleInclude = (key: string, enabled: boolean) => {
    const current = Array.isArray(config?.include) ? config.include : [];
    const next = enabled
      ? Array.from(new Set([...current, key]))
      : current.filter((a: any) => a !== key);

    updateConfig({
      ...config,
      include: next.length ? next : undefined,
    });
  };

  const getVectorStoreIds = (): string[] => {
    const v = config?.file_search?.vector_store_ids;
    return Array.isArray(v) ? v : [];
  };

  return (
    <theme.Card
      size="small"
      title={t("providers:openai.file_search")}
      headerActions={
        <theme.Switch
          id="fileSearch"
          checked={fileSearchOn}
          onChange={(val) =>
            updateConfig({
              ...config,
              file_search: !val ? undefined : { ...DEFAULT_FILE_SEARCH },
            })
          }
        />
      }
    >
      <div>
        <theme.Slider
          label={
            config?.file_search?.max_num_results
              ? t("providers:openai.max_num_results") +
                ` (${config?.file_search?.max_num_results})`
              : t("providers:openai.max_num_results")
          }
          disabled={!fileSearchOn}
          min={1}
          max={50}
          value={config?.file_search?.max_num_results ?? 10}
          onChange={(e: number) =>
            updateConfig({
              ...config,
              file_search: {
                ...(config.file_search ?? { ...DEFAULT_FILE_SEARCH }),
                max_num_results: e,
              },
            })
          }
        />

        <theme.Input
          label={t("providers:openai.vector_store_ids")}
          placeholder="vs_xxx, vs_zzz"
          disabled={!fileSearchOn}
          value={getVectorStoreIds().join(", ")}
          onChange={(e: any) =>
            updateConfig({
              ...config,
              file_search: {
                ...(config.file_search ?? { ...DEFAULT_FILE_SEARCH }),
                vector_store_ids: e.target.value
                  .split(",")
                  .map((s: string) => s.trim())
                  .filter(Boolean),
              },
            })
          }
        />

        <theme.Switch
          id="includeSearchResults"
          checked={config?.include?.includes("file_search_call.results")}
          disabled={!fileSearchOn}
          label={t("providers:openai.includeSearchResults")}
          onChange={(value) =>
            toggleInclude("file_search_call.results", !!value)
          }
        />
      </div>
    </theme.Card>
  );
};

