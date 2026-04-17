import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";
import {
  AnthropicJsonTextArea,
  AnthropicSharedToolFields,
  parseAnthropicNumberInput,
} from "./AnthropicToolCardShared";

const TEXT_EDITOR_VERSIONS = [
  "text_editor_20250728",
  "text_editor_20250429",
  "text_editor_20250124",
];

const getTextEditorName = (type: string) =>
  type === "text_editor_20250124"
    ? "str_replace_editor"
    : "str_replace_based_edit_tool";

const createDefaultTextEditorTool = () => ({
  name: getTextEditorName(TEXT_EDITOR_VERSIONS[0]),
  type: TEXT_EDITOR_VERSIONS[0],
  allowed_callers: ["direct"]
});

export const AnthropicTextEditorCard = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const textEditorOn = !!config?.text_editor;
  const tool = config?.text_editor ?? createDefaultTextEditorTool();
  const supportsMaxCharacters = tool?.type === "text_editor_20250728";

  return (
    <theme.Card
      size="small"
      title={t("providers:anthropic.textEditor")}
      headerActions={
        <theme.Switch
          id="anthropic-text-editor"
          checked={textEditorOn}
          onChange={(checked: boolean) =>
            updateConfig({
              ...config,
              text_editor: checked ? createDefaultTextEditorTool() : undefined,
            })
          }
        />
      }
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <AnthropicSharedToolFields
          idPrefix="anthropic-text-editor"
          disabled={!textEditorOn}
          tool={tool}
          versions={TEXT_EDITOR_VERSIONS}
          onVersionChange={(value: string) =>
            updateConfig({
              ...config,
              text_editor: {
                ...tool,
                name: getTextEditorName(value),
                type: value,
                max_characters:
                  value === "text_editor_20250728"
                    ? tool?.max_characters
                    : undefined,
              },
            })
          }
          onChange={(nextTool: any) =>
            updateConfig({
              ...config,
              text_editor: {
                ...nextTool,
                name: getTextEditorName(nextTool?.type ?? TEXT_EDITOR_VERSIONS[0]),
              },
            })
          }
        />

        <AnthropicJsonTextArea
          label={t("providers:anthropic.inputExamples")}
          disabled={!textEditorOn}
          placeholder="[]"
          value={tool?.input_examples}
          onChange={(value) =>
            updateConfig({
              ...config,
              text_editor: {
                ...tool,
                input_examples: value,
              },
            })
          }
        />

        {supportsMaxCharacters ? (
          <theme.Input
            type="number"
            label={t("providers:anthropic.maxCharacters")}
            disabled={!textEditorOn}
            value={tool?.max_characters ?? ""}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                text_editor: {
                  ...tool,
                  max_characters: parseAnthropicNumberInput(e.target.value),
                },
              })
            }
          />
        ) : null}
      </div>
    </theme.Card>
  );
};
