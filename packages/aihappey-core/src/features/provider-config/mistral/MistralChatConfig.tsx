// MistralChatConfig.tsx
import { MistralChatConfigForm } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";

export const MistralChatConfig = ({
  mistral,
  updateMistral,
}: {
  mistral: any;
  updateMistral: (val: any) => void;
}) => {
  const { t } = useTranslation();

  return (
    <MistralChatConfigForm
      config={mistral}
      updateConfig={updateMistral}
      translations={{
        webSearch: t("webSearch"),
        webSearchPremium: t("providers:mistral.webSearchPremium"),

        image_generation: t("image_generation"),
        code_execution: t("code_execution"),

        file_search: t("providers:openai.file_search"),
        vector_store_ids: t("providers:openai.vector_store_ids"),

        parallelToolCalls: t("parallelToolCalls"),
        instructionsLabel: t("providers:openai.instructions"),
        instructionsPlaceholder: t("providers:openai.instructionsPlaceholder"),
      }}
    />
  );
};
