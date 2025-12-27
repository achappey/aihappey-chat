import { useTranslation } from "aihappey-i18n";
import { GroqChatConfigForm } from "aihappey-components";

export const GroqChatConfig = ({
  groq,
  updateGroq,
}: {
  groq: any;
  updateGroq: (val: any) => void;
}) => {
  const { t } = useTranslation();

  return (
    <GroqChatConfigForm
      config={groq}
      updateConfig={updateGroq}
      translations={{
        reasoning: t("reasoning"),
        reasoningEffort: t("reasoningEffort"),
        webSearch: t("webSearch"),
        code_execution: t("code_execution"),
        parallelToolCalls: t("parallelToolCalls"),
        instructionsLabel: t("providers:openai.instructions"),
        instructionsPlaceholder: t("providers:openai.instructionsPlaceholder"),
        low: t("low"),
        medium: t("medium"),
        high: t("high"),
      }}
    />
  );
};
