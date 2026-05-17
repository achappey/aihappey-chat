import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";
import {
  AnthropicJsonTextArea,
  AnthropicSharedToolFields,
} from "./AnthropicToolCardShared";

const BASH_VERSIONS = ["bash_20250124"];

const createDefaultBashTool = () => ({
  name: "bash",
  type: BASH_VERSIONS[0],
  allowed_callers: ["direct"]
});

export const AnthropicBashCard = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const bashOn = !!config?.bash;
  const tool = config?.bash ?? createDefaultBashTool();

  return (
    <theme.Card
      size="small"
      title={"Bash"}
      headerActions={
        <theme.Switch
          id="anthropic-bash"
          checked={bashOn}
          onChange={(checked: boolean) =>
            updateConfig({
              ...config,
              bash: checked ? createDefaultBashTool() : undefined,
            })
          }
        />
      }
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <AnthropicSharedToolFields
          idPrefix="anthropic-bash"
          disabled={!bashOn}
          tool={tool}
          versions={BASH_VERSIONS}
          onVersionChange={(value: string) =>
            updateConfig({
              ...config,
              bash: {
                ...tool,
                name: "bash",
                type: value,
              },
            })
          }
          onChange={(nextTool: any) =>
            updateConfig({
              ...config,
              bash: {
                ...nextTool,
                name: "bash",
              },
            })
          }
        />

        <AnthropicJsonTextArea
          label={t("providers:anthropic.inputExamples")}
          disabled={!bashOn}
          placeholder="[]"
          value={tool?.input_examples}
          onChange={(value) =>
            updateConfig({
              ...config,
              bash: {
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
