// PerplexityChatConfigForm.tsx

import { useTranslation } from "aihappey-i18n";
import type { ModelOption } from "aihappey-types";
import { useTheme } from "../../../theme/ThemeContext";
import { PerplexityResponsesWebSearchCardForm } from "./cards/PerplexityResponsesWebSearchCardForm";
import { PerplexityFetchUrlCardForm } from "./cards/PerplexityFetchUrlCardForm";
import { PerplexityFinanceSearchCardForm } from "./cards/PerplexityFinanceSearchCardForm";
import { PerplexityPeopleSearchCardForm } from "./cards/PerplexityPeopleSearchCardForm";
import { PerplexityReasoningCardForm } from "./cards/PerplexityReasoningCardForm";
import { PerplexityAgentCardForm } from "./cards/PerplexityAgentCardForm";
import { withResolvedProviderTools } from "../providerToolConfig";

const PERPLEXITY_TOOL_TYPES = [
  "web_search",
  "fetch_url",
  "finance_search",
  "people_search",
];

export const PerplexityChatConfigForm = ({
  config,
  updateConfig,
  models,
}: {
  config: any;
  updateConfig: (val: any) => void;
  models?: ModelOption[];
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const resolvedConfig = withResolvedProviderTools(config, PERPLEXITY_TOOL_TYPES);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      <PerplexityReasoningCardForm config={config} updateConfig={updateConfig} />

      <PerplexityAgentCardForm
        config={config}
        updateConfig={updateConfig}
        models={models}
      />

      <PerplexityResponsesWebSearchCardForm
        config={resolvedConfig}
        updateConfig={updateConfig}
      />

      <PerplexityFetchUrlCardForm config={resolvedConfig} updateConfig={updateConfig} />

      <PerplexityFinanceSearchCardForm
        config={resolvedConfig}
        updateConfig={updateConfig}
      />

      <PerplexityPeopleSearchCardForm
        config={resolvedConfig}
        updateConfig={updateConfig}
      />
     
    </div>
  );
};
