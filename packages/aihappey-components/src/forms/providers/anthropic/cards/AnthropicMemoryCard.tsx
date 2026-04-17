import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";
import {
  AnthropicJsonTextArea,
  AnthropicSharedToolFields,
} from "./AnthropicToolCardShared";

const MEMORY_VERSIONS = ["memory_20250818"];

const createDefaultMemoryTool = () => ({
  name: "memory",
  type: MEMORY_VERSIONS[0],
  allowed_callers: ["direct"]
});

export const AnthropicMemoryCard = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const memoryOn = !!config?.memory;
  const tool = config?.memory ?? createDefaultMemoryTool();

  return (
    <theme.Card
      size="small"
      title="Memory"
      headerActions={
        <theme.Switch
          id="anthropic-memory"
          checked={memoryOn}
          onChange={(checked: boolean) =>
            updateConfig({
              ...config,
              memory: checked ? createDefaultMemoryTool() : undefined,
            })
          }
        />
      }
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <AnthropicSharedToolFields
          idPrefix="anthropic-memory"
          disabled={!memoryOn}
          tool={tool}
          versions={MEMORY_VERSIONS}
          onVersionChange={(value: string) =>
            updateConfig({
              ...config,
              memory: {
                ...tool,
                name: "memory",
                type: value,
              },
            })
          }
          onChange={(nextTool: any) =>
            updateConfig({
              ...config,
              memory: {
                ...nextTool,
                name: "memory",
              },
            })
          }
        />

        <AnthropicJsonTextArea
          label={t("providers:anthropic.inputExamples")}
          disabled={!memoryOn}
          placeholder="[]"
          value={tool?.input_examples}
          onChange={(value) =>
            updateConfig({
              ...config,
              memory: {
                ...tool,
                input_examples: value,
              },
            })
          }
        />
      </div>
    </theme.Card>
  );
};
