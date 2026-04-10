import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";
import { AnthropicSharedToolFields } from "./AnthropicToolCardShared";

const TOOL_SEARCH_REGEX_VERSIONS = [
  "tool_search_tool_regex_20251119",
  "tool_search_tool_regex",
];

const createDefaultToolSearchRegexTool = () => ({
  name: "tool_search_tool_regex",
  type: TOOL_SEARCH_REGEX_VERSIONS[0],
});

export const AnthropicToolSearchRegexCard = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const toolOn = !!config?.tool_search_tool_regex;
  const tool = config?.tool_search_tool_regex ?? createDefaultToolSearchRegexTool();

  return (
    <theme.Card
      size="small"
      title={t("providers:anthropic.toolSearchRegex")}
      headerActions={
        <theme.Switch
          id="anthropic-tool-search-regex"
          checked={toolOn}
          onChange={(checked: boolean) =>
            updateConfig({
              ...config,
              tool_search_tool_regex: checked
                ? createDefaultToolSearchRegexTool()
                : undefined,
            })
          }
        />
      }
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <AnthropicSharedToolFields
          idPrefix="anthropic-tool-search-regex"
          disabled={!toolOn}
          tool={tool}
          versions={TOOL_SEARCH_REGEX_VERSIONS}
          onVersionChange={(value: string) =>
            updateConfig({
              ...config,
              tool_search_tool_regex: {
                ...tool,
                name: "tool_search_tool_regex",
                type: value,
              },
            })
          }
          onChange={(nextTool: any) =>
            updateConfig({
              ...config,
              tool_search_tool_regex: {
                ...nextTool,
                name: "tool_search_tool_regex",
              },
            })
          }
        />
      </div>
    </theme.Card>
  );
};
