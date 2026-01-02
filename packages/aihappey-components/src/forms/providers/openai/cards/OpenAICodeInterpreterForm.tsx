import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

const DEFAULT_CODE_INTERPRETER = {
  container: {
    type: "auto",
  },
};

export const OpenAICodeInterpreterForm = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const codeInterpreterOn = !!config?.code_interpreter;

  const toggleInclude = (key: string, enabled: boolean) => {
    const current = Array.isArray(config?.include) ? config.include : [];
    const next = enabled
      ? Array.from(new Set([...current, key]))
      : current.filter((a: any) => a !== key);

    updateConfig({
      ...config,
      include: next.length ? next : undefined,
    });
  };

  return (
    <theme.Card
      size="small"
      title={t("code_execution")}
      headerActions={
        <theme.Switch
          id="codeInterpreter"
          checked={codeInterpreterOn}
          onChange={(val) =>
            updateConfig({
              ...config,
              code_interpreter: !val ? undefined : { ...DEFAULT_CODE_INTERPRETER },
            })
          }
        />
      }
    >
      <div>
        <theme.Input
          label={t("providers:openai.container")}
          placeholder="cntr_xxx or cntr_zzz"
          disabled={!codeInterpreterOn}
          value={
            config?.code_interpreter?.container &&
            typeof config?.code_interpreter?.container === "string"
              ? config?.code_interpreter?.container
              : ""
          }
          onChange={(e: any) =>
            updateConfig({
              ...config,
              code_interpreter:
                e.target.value.trim() && e.target.value.trim().length > 0
                  ? { container: e.target.value.trim() }
                  : { ...DEFAULT_CODE_INTERPRETER },
            })
          }
        />

        <theme.Switch
          id="includeOutputs"
          disabled={!codeInterpreterOn}
          checked={config?.include?.includes("code_interpreter_call.outputs")}
          label={t("providers:openai.includeOutputs")}
          onChange={(value) =>
            toggleInclude("code_interpreter_call.outputs", !!value)
          }
        />
      </div>
    </theme.Card>
  );
};

