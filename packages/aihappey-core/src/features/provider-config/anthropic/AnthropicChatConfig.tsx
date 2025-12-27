// AnthropicChatConfig.tsx
import { useTranslation } from "aihappey-i18n";
import { AnthropicChatConfigForm } from "aihappey-components";

export const AnthropicChatConfig = ({
  anthropic,
  updateAnthropic,
}: {
  anthropic: any;
  updateAnthropic: (val: any) => void;
}) => {
  const { t } = useTranslation();

  return (
    <AnthropicChatConfigForm
      config={anthropic}
      updateConfig={updateAnthropic}
      translations={{
        reasoning: t("reasoning"),
        budget: t("budget"),

        webSearch: t("webSearch"),
        webFetch: t("webFetch"),

        maxUses: t("providers:anthropic.maxUses"),
        allowedDomains: t("providers:anthropic.allowedDomains"),
        blockedDomains: t("providers:anthropic.blockedDomains"),

        country: t("country"),
        region: t("region"),
        city: t("city"),
        timezone: t("timezone"),

        citations: t("citations"),

        code_execution: t("code_execution"),

        xlsx: t("xlsx"),
        pptx: t("pptx"),
        docx: t("docx"),
        pdf: t("pdf"),

        customSkills: t("providers:anthropic.customSkills"),

        memory: t("memory"),
        nativeMcp: t("nativeMcp"),
      }}
    />
  );
};
