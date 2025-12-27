// JinaChatConfig.tsx
import { useTranslation } from "aihappey-i18n";
import { JinaChatConfigForm } from "aihappey-components";

export const JinaChatConfig = ({
  jina,
  updateJina,
}: {
  jina: any;
  updateJina: (val: any) => void;
}) => {
  const { t } = useTranslation();

  return (
    <JinaChatConfigForm
      config={jina}
      updateConfig={updateJina}
      translations={{
        reasoning: t("reasoning"),
        reasoningEffort: t("reasoningEffort"),
        low: t("low"),
        medium: t("medium"),
        high: t("high"),

        max_returned_urls: t("providers:jina.max_returned_urls"),
        team_size: t("providers:jina.team_size"),
        goodDomains: t("providers:jina.goodDomains"),
        badDomains: t("providers:jina.badDomains"),
        onlyDomains: t("providers:jina.onlyDomains"),
        search_provider: t("providers:jina.search_provider"),
      }}
    />
  );
};
