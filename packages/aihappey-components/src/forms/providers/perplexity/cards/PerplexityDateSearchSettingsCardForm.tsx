import React from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";

export const PerplexityDateSearchSettingsCardForm: React.FC<{
  config: any;
  updateConfig: (val: any) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <theme.Card size="small" title={t("providers:perplexity.dateSearchSettings") + " (Sonar)"}>
      <div>
        <theme.Input
          label={t("providers:perplexity.searchRecencyFilter")}
          placeholder="week, day, month..."
          value={config?.search_recency_filter ?? ""}
          onChange={(e: any) =>
            updateConfig({
              ...config,
              search_recency_filter: e.target.value,
            })
          }
        />

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <theme.Input
            label={t("providers:perplexity.searchAfterDateFilter")}
            type="datetime-local"
            value={config?.search_after_date_filter ?? ""}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                search_after_date_filter: e.target.value,
              })
            }
            style={{ minWidth: 180 }}
          />
          <theme.Input
            label={t("providers:perplexity.searchBeforeDateFilter")}
            type="datetime-local"
            value={config?.search_before_date_filter ?? ""}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                search_before_date_filter: e.target.value,
              })
            }
            style={{ minWidth: 180 }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <theme.Input
            label={t("providers:perplexity.lastUpdatedAfterFilter")}
            type="datetime-local"
            value={config?.last_updated_after_filter ?? ""}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                last_updated_after_filter: e.target.value,
              })
            }
            style={{ minWidth: 180 }}
          />
          <theme.Input
            label={t("providers:perplexity.lastUpdatedBeforeFilter")}
            type="datetime-local"
            value={config?.last_updated_before_filter ?? ""}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                last_updated_before_filter: e.target.value,
              })
            }
            style={{ minWidth: 180 }}
          />
        </div>
      </div>
    </theme.Card>
  );
};

