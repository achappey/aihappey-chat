// GoogleChatConfig.tsx
import { useTranslation } from "aihappey-i18n";
import { GoogleChatConfigForm } from "aihappey-components";

export const GoogleChatConfig = ({
  google,
  updateGoogle,
}: {
  google: any;
  updateGoogle: (val: any) => void;
}) => {
  const { t } = useTranslation();

  return (
    <GoogleChatConfigForm
      config={google}
      updateConfig={updateGoogle}
      translations={{
        reasoning: t("reasoning"),
        reasoningEffort: t("reasoningEffort"),
        budget: t("budget"),
        webSearch: t("webSearch"),
        code_execution: t("code_execution"),
        low: t("low"),
        medium: t("medium"),
        high: t("high"),

        unspecified: t("providers:google.unspecified"),
        includeThoughts: t("providers:google.includeThoughts"),

        intervalStart: t("providers:google.intervalStart"),
        intervalEnd: t("providers:google.intervalEnd"),

        googleMaps: t("providers:google.googleMaps"),
        url_context: t("providers:google.url_context"),

        mediaResolution: t("providers:google.mediaResolution"),
        enableEnhancedCivicAnswers: t("providers:google.enableEnhancedCivicAnswers"),

        blockingConfidence_label: t("providers:google.blockingConfidence.label"),
        blockingConfidence_unspecified: t(
          "providers:google.blockingConfidence.unspecified"
        ),
        blockingConfidence_lowAndAbove: t(
          "providers:google.blockingConfidence.lowAndAbove"
        ),
        blockingConfidence_mediumAndAbove: t(
          "providers:google.blockingConfidence.mediumAndAbove"
        ),
        blockingConfidence_highAndAbove: t(
          "providers:google.blockingConfidence.highAndAbove"
        ),
        blockingConfidence_higherAndAbove: t(
          "providers:google.blockingConfidence.higherAndAbove"
        ),
        blockingConfidence_veryHighAndAbove: t(
          "providers:google.blockingConfidence.veryHighAndAbove"
        ),
        blockingConfidence_onlyExtremelyHigh: t(
          "providers:google.blockingConfidence.onlyExtremelyHigh"
        ),
      }}
    />
  );
};
