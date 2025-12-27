// XAIChatConfig.tsx
import { useTranslation } from "aihappey-i18n";
import { XAIChatConfigForm } from "aihappey-components";

export const XAIChatConfig = ({
  xAI,
  updateXAI,
}: {
  xAI: any;
  updateXAI: (val: any) => void;
}) => {
  const { t } = useTranslation();

  return (
    <XAIChatConfigForm
      config={xAI}
      updateConfig={updateXAI}
      translations={{
        reasoning: t("reasoning"),
        webSearch: t("webSearch"),
        xSearch: t("xSearch"),
        code_execution: t("code_execution"),
        parallelToolCalls: t("parallelToolCalls"),
        instructionsLabel: t("providers:openai.instructions"),
        instructionsPlaceholder: t("providers:openai.instructionsPlaceholder"),
        allowedDomains: t("providers:xai.allowedDomains"),
        excludedDomains: t("providers:xai.excludedDomains"),
        allowedXHandles: t("providers:xai.allowed_x_handles"),
        excludedXHandles: t("providers:xai.excluded_x_handles"),
        imageUnderstanding: t("providers:xai.imageUnderstanding"),
        videoUnderstanding: t("providers:xai.videoUnderstanding"),
      }}
    />
  );
};
