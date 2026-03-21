import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import { OpenAIReasoningForm } from "./cards/OpenAIReasoningForm";
import { OpenAIWebSearchForm } from "./cards/OpenAIWebSearchForm";
import { OpenAIImageGenerationForm } from "./cards/OpenAIImageGenerationForm";
import { OpenAICodeInterpreterForm } from "./cards/OpenAICodeInterpreterForm";
import { OpenAIFileSearchForm } from "./cards/OpenAIFileSearchForm";
import { OpenAIShellForm } from "./cards/OpenAIShellForm";

export const OpenAIChatConfigForm = ({
  config,
  updateConfig,
  openAISkillOptions = [],
}: {
  config: any;
  updateConfig: (val: any) => void;
  openAISkillOptions?: Array<{ value: string; label: string }>;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <OpenAIReasoningForm config={config} updateConfig={updateConfig} />
      <OpenAIWebSearchForm config={config} updateConfig={updateConfig} />
      <OpenAIImageGenerationForm config={config} updateConfig={updateConfig} />
      <OpenAICodeInterpreterForm config={config} updateConfig={updateConfig} />
      <OpenAIShellForm
        config={config}
        updateConfig={updateConfig}
        openAISkillOptions={openAISkillOptions}
      />
      <OpenAIFileSearchForm config={config} updateConfig={updateConfig} />

      <theme.Card
        size="small"
        title={t("nativeMcp")}
        headerActions={
          <theme.Switch
            id="nativeMcp"
            checked={!!config?.native_mcp}
            onChange={(val) =>
              updateConfig({
                ...config,
                native_mcp: val,
              })
            }
          />
        }
      />

      <theme.Switch
        id="parallelToolCalls"
        checked={!!config?.parallel_tool_calls}
        label={t("parallelToolCalls")}
        onChange={(value) =>
          updateConfig({
            ...config,
            parallel_tool_calls: value,
          })
        }
      />

      <theme.TextArea
        label={t("providers:openai.instructions")}
        placeholder={t(
          "providers:openai.instructionsPlaceholder"
        )}
        rows={5}
        value={config?.instructions}
        onChange={(value) =>
          updateConfig({
            ...config,
            instructions: value,
          })
        }
      />
    </div>
  );
};
