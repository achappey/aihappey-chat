// PerplexityChatConfigForm.tsx

import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../theme/ThemeContext";
import { PerplexityWebSearchCardForm } from "./cards/PerplexityWebSearchCardForm";
import { PerplexityDateSearchSettingsCardForm } from "./cards/PerplexityDateSearchSettingsCardForm";
import { PerplexitySonarDeepResearchCardForm } from "./cards/PerplexitySonarDeepResearchCardForm";
import { PerplexityMediaCardForm } from "./cards/PerplexityMediaCardForm";

export const PerplexityChatConfigForm = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <PerplexityWebSearchCardForm config={config} updateConfig={updateConfig} />

      <PerplexityDateSearchSettingsCardForm
        config={config}
        updateConfig={updateConfig}
      />

      <PerplexitySonarDeepResearchCardForm config={config} updateConfig={updateConfig} />

      <PerplexityMediaCardForm config={config} updateConfig={updateConfig} />

      <theme.Switch
        id="enableSearchClassifier"
        label={t("providers:perplexity.enableSearchClassifier")}
        checked={!!config?.enable_search_classifier}
        onChange={(val) =>
          updateConfig({
            ...config,
            enable_search_classifier: val,
          })
        }
      />


      <theme.Switch
        id="questions"
        label={t("providers:perplexity.returnRelatedQuestions")}
        checked={!!config?.return_related_questions}
        onChange={() =>
          updateConfig({
            ...config,
            return_related_questions: !config?.return_related_questions,
          })
        }
      />
    </div>
  );
};
