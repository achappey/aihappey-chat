// OpenAIChatConfig.tsx
import { useTranslation } from "aihappey-i18n";
import { OpenAIChatConfigForm } from "aihappey-components";

export const OpenAIChatConfig = ({
  openai,
  updateOpenAI,
}: {
  openai: any;
  updateOpenAI: (val: any) => void;
}) => {
  const { t } = useTranslation();

  return (
    <OpenAIChatConfigForm
      config={openai}
      updateConfig={updateOpenAI}
      translations={{
        reasoning: t("reasoning"),
        reasoningEffort: t("reasoningEffort"),
        reasoningSummary: t("reasoningSummary"),
        encryptedContent: t("providers:openai.encryptedContent"),

        webSearch: t("webSearch"),
        searchContextSize: t("searchContextSize"),
        includeSources: t("providers:openai.includeSources"),

        image_generation: t("image_generation"),
        model: t("model"),
        partial_images: t("partial_images"),
        input_fidelity: t("input_fidelity"),
        quality: t("quality"),
        background: t("background"),
        size: t("size"),

        code_execution: t("code_execution"),
        container: t("providers:openai.container"),
        includeOutputs: t("providers:openai.includeOutputs"),

        file_search: t("providers:openai.file_search"),
        max_num_results: t("providers:openai.max_num_results"),
        vector_store_ids: t("providers:openai.vector_store_ids"),
        includeSearchResults: t("providers:openai.includeSearchResults"),

        nativeMcp: t("nativeMcp"),
        parallelToolCalls: t("parallelToolCalls"),

        instructionsLabel: t("providers:openai.instructions"),
        instructionsPlaceholder: t("providers:openai.instructionsPlaceholder"),

        auto: t("auto"),
        concise: t("concise"),
        detailed: t("detailed"),

        low: t("low"),
        medium: t("medium"),
        high: t("high"),
        none: t("none"),

        transparent: t("transparent"),
        opaque: t("opaque"),

        country: t("country"),
        region: t("region"),
        city: t("city"),
        timezone: t("timezone"),

        s1024x1024: t("1024x1024"),
        s1024x1536: t("1024x1536"),
        s1536x1024: t("1536x1024"),
      }}
    />
  );
};
