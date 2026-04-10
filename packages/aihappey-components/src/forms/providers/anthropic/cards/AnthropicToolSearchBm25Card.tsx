import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";
import { AnthropicSharedToolFields } from "./AnthropicToolCardShared";

const TOOL_SEARCH_BM25_VERSIONS = [
  "tool_search_tool_bm25_20251119",
  "tool_search_tool_bm25",
];

const createDefaultToolSearchBm25Tool = () => ({
  name: "tool_search_tool_bm25",
  type: TOOL_SEARCH_BM25_VERSIONS[0],
});

export const AnthropicToolSearchBm25Card = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const toolOn = !!config?.tool_search_tool_bm25;
  const tool = config?.tool_search_tool_bm25 ?? createDefaultToolSearchBm25Tool();

  return (
    <theme.Card
      size="small"
      title={t("providers:anthropic.toolSearchBm25")}
      headerActions={
        <theme.Switch
          id="anthropic-tool-search-bm25"
          checked={toolOn}
          onChange={(checked: boolean) =>
            updateConfig({
              ...config,
              tool_search_tool_bm25: checked
                ? createDefaultToolSearchBm25Tool()
                : undefined,
            })
          }
        />
      }
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <AnthropicSharedToolFields
          idPrefix="anthropic-tool-search-bm25"
          disabled={!toolOn}
          tool={tool}
          versions={TOOL_SEARCH_BM25_VERSIONS}
          onVersionChange={(value: string) =>
            updateConfig({
              ...config,
              tool_search_tool_bm25: {
                ...tool,
                name: "tool_search_tool_bm25",
                type: value,
              },
            })
          }
          onChange={(nextTool: any) =>
            updateConfig({
              ...config,
              tool_search_tool_bm25: {
                ...nextTool,
                name: "tool_search_tool_bm25",
              },
            })
          }
        />
      </div>
    </theme.Card>
  );
};
