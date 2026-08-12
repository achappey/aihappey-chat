import React from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";
import { buildCanonicalProviderToolsConfig } from "../../providerToolConfig";

const DEFAULT_SANDBOX = {
  type: "sandbox",
};

const PERPLEXITY_TOOL_TYPES = [
  "web_search",
  "fetch_url",
  "finance_search",
  "people_search",
  "sandbox",
];

export const PerplexitySandboxCardForm: React.FC<{
  config: any;
  updateConfig: (val: any) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const sandboxOn = !!config?.sandbox;
  const submitConfig = (nextConfig: any) =>
    updateConfig(
      buildCanonicalProviderToolsConfig(nextConfig, PERPLEXITY_TOOL_TYPES)
    );

  return (
    <theme.Card
      size="small"
      title={t("code_execution")}
      headerActions={
        <theme.Switch
          id="perplexitySandbox"
          checked={sandboxOn}
          onChange={(val) =>
            submitConfig({
              ...config,
              sandbox: val ? { ...DEFAULT_SANDBOX } : undefined,
            })
          }
        />
      }
    />
  );
};
