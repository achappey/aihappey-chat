// TogetherChatConfig.tsx
import { useTranslation } from "aihappey-i18n";
import { TogetherChatConfigForm } from "aihappey-components";

export const TogetherChatConfig = ({
  together,
  updateTogether,
}: {
  together: any;
  updateTogether: (val: any) => void;
}) => {
  const { t } = useTranslation();

  return (
    <TogetherChatConfigForm
      config={together}
      updateConfig={updateTogether}
      translations={{
        reasoning: t("reasoning"),
        reasoningEffort: t("reasoningEffort"),
        low: t("low"),
        medium: t("medium"),
        high: t("high"),
      }}
    />
  );
};
