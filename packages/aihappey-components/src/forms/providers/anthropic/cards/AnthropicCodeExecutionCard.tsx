import { useTheme } from "../../../../theme/ThemeContext";
import { AnthropicSharedToolFields } from "./AnthropicToolCardShared";

const CODE_EXECUTION_VERSIONS = [
  "code_execution_20260120",
  "code_execution_20250825",
  "code_execution_20250522",
];

const createDefaultCodeExecutionTool = () => ({
  name: "code_execution",
  type: CODE_EXECUTION_VERSIONS[0],
  allowed_callers: ["direct"]
});

export const AnthropicCodeExecutionCard = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const codeExecutionOn = !!config?.code_execution;
  const tool = config?.code_execution ?? createDefaultCodeExecutionTool();

  return (
    <theme.Card
      size="small"
      title="Code execution"
      headerActions={
        <theme.Switch
          id="anthropic-code-execution"
          checked={codeExecutionOn}
          onChange={(checked: boolean) =>
            updateConfig({
              ...config,
              code_execution: checked ? createDefaultCodeExecutionTool() : undefined,
            })
          }
        />
      }
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <AnthropicSharedToolFields
          idPrefix="anthropic-code-execution"
          disabled={!codeExecutionOn}
          tool={tool}
          versions={CODE_EXECUTION_VERSIONS}
          onVersionChange={(value: string) =>
            updateConfig({
              ...config,
              code_execution: {
                ...tool,
                name: "code_execution",
                type: value,
              },
            })
          }
          onChange={(nextTool: any) =>
            updateConfig({
              ...config,
              code_execution: {
                ...nextTool,
                name: "code_execution",
              },
            })
          }
        />
      </div>
    </theme.Card>
  );
};
