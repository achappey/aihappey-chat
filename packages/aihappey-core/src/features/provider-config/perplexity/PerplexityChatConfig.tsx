// PerplexityChatConfig.tsx
import { useTranslation } from "aihappey-i18n";
import { PerplexityChatConfigForm } from "aihappey-components";

export const PerplexityChatConfig = ({
  perplexity,
  updatePerplexity,
}: {
  perplexity: any;
  updatePerplexity: (val: any) => void;
}) => {
  const { t } = useTranslation();

  return (
    <PerplexityChatConfigForm
      config={perplexity}
      updateConfig={updatePerplexity}
      translations={{
        webSearch: t("webSearch"),
        searchMode: t("searchMode"),
        searchContextSize: t("searchContextSize"),
        latitude: t("latitude"),
        longitude: t("longitude"),
        country: t("country"),
        low: t("low"),
        medium: t("medium"),
        high: t("high"),

        improveImageRelevance: t("providers:perplexity.improveImageRelevance"),

        dateSearchSettings: t("providers:perplexity.dateSearchSettings"),
        searchRecencyFilter: t("providers:perplexity.searchRecencyFilter"),
        searchAfterDateFilter: t("providers:perplexity.searchAfterDateFilter"),
        searchBeforeDateFilter: t("providers:perplexity.searchBeforeDateFilter"),
        lastUpdatedAfterFilter: t("providers:perplexity.lastUpdatedAfterFilter"),
        lastUpdatedBeforeFilter: t("providers:perplexity.lastUpdatedBeforeFilter"),

        sonarDeepResearch: t("providers:perplexity.sonarDeepResearch"),
        reasoning: t("reasoning"),

        enableSearchClassifier: t("providers:perplexity.enableSearchClassifier"),
        returnImages: t("providers:perplexity.returnImages"),
        returnVideos: t("providers:perplexity.returnVideos"),
        returnRelatedQuestions: t("providers:perplexity.returnRelatedQuestions"),

        web: t("providers:perplexity.web"),
        academic: t("providers:perplexity.academic"),
      }}
    />
  );
};
