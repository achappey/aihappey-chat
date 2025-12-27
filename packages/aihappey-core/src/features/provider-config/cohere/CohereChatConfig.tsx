// CohereChatConfig.tsx
import { useTranslation } from "aihappey-i18n";
import { CohereChatConfigForm } from "aihappey-components";

export const CohereChatConfig = ({
  cohere,
  updateCohere,
}: {
  cohere: any;
  updateCohere: (val: any) => void;
}) => {
  const { t } = useTranslation();

  return (
    <CohereChatConfigForm
      config={cohere}
      updateConfig={updateCohere}
      translations={{
        reasoning: t("reasoning"),
        budget: t("budget"),

        citationOptions: t("providers:cohere.citationOptions"),
        mode: t("providers:cohere.mode"),

        enabled: t("enabled"),
        disabled: t("disabled"),
        fast: t("fast"),
        accurate: t("accurate"),
        off: t("off"),
      }}
    />
  );
};
