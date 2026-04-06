import React from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";

const DEFAULT_FETCH_URL = {
  type: "fetch_url",
};

const EMPTY_FETCH_URL = {
  ...DEFAULT_FETCH_URL,
  max_urls: "",
};

export const PerplexityFetchUrlCardForm: React.FC<{
  config: any;
  updateConfig: (val: any) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const fetchUrlOn = !!config?.fetch_url;

  const fetchUrl = {
    ...EMPTY_FETCH_URL,
    ...(config?.fetch_url ?? {}),
    type: "fetch_url",
  };

  return (
    <theme.Card
      size="small"
      title={t("providers:perplexity.fetchUrl")  + " (Agents)"}
      headerActions={
        <theme.Switch
          id="perplexityFetchUrl"
          checked={fetchUrlOn}
          onChange={(val) =>
            updateConfig({
              ...config,
              fetch_url: val ? { ...DEFAULT_FETCH_URL } : undefined,
            })
          }
        />
      }
    >
      <div>
        <theme.Input
          label={t("providers:perplexity.maxUrls")}
          type="number"
          min={1}
          max={10}
          disabled={!fetchUrlOn}
          value={fetchUrl.max_urls ?? ""}
          onChange={(e: any) =>
            updateConfig({
              ...config,
              fetch_url: {
                ...fetchUrl,
                type: "fetch_url",
                max_urls: e.target.value === "" ? "" : Number(e.target.value),
              },
            })
          }
        />
      </div>
    </theme.Card>
  );
};
