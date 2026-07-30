import React from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";
import { buildCanonicalProviderToolsConfig } from "../../providerToolConfig";

const DEFAULT_FINANCE_SEARCH = {
  type: "finance_search",
};

const PERPLEXITY_TOOL_TYPES = [
  "web_search",
  "fetch_url",
  "finance_search",
  "people_search",
];

export const PerplexityFinanceSearchCardForm: React.FC<{
  config: any;
  updateConfig: (val: any) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const financeSearchOn = !!config?.finance_search;
  const submitConfig = (nextConfig: any) =>
    updateConfig(
      buildCanonicalProviderToolsConfig(nextConfig, PERPLEXITY_TOOL_TYPES)
    );

  return (
    <theme.Card
      size="small"
      title={t("providers:perplexity.financeSearch")}
      headerActions={
        <theme.Switch
          id="perplexityFinanceSearch"
          checked={financeSearchOn}
          onChange={(val) =>
            submitConfig({
              ...config,
              finance_search: val ? { ...DEFAULT_FINANCE_SEARCH } : undefined,
            })
          }
        />
      }
    />
  );
};

