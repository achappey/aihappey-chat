import React, { useState } from "react";
import { ToolInvocationCard as ToolInvocationCardComponent } from "aihappey-components";
import { ToolCallResultModal } from "./ToolCallResultModal";
import { useTranslation } from "aihappey-i18n";
import { explainToolCall } from "../../../../runtime/chat-app/explainToolCall";
import { Markdown } from "../../../../ui/markdown/Markdown";

export interface ToolInvocationCardProps {
  invocation: any;
  tool?: any;
}

export const ToolInvocationCard: React.FC<ToolInvocationCardProps> = ({
  invocation,
  tool,
}) => {
  const { t, i18n } = useTranslation();
  const [output, setOutput] = useState<any | null>(null);
  const getToolExplanation = async (invocation: any, tool: any) => await explainToolCall(
    JSON.stringify({ toolcall: invocation, tool }),
    i18n.language
  );

  return (
    <>
      <ToolInvocationCardComponent
        invocation={invocation}
        tool={tool}
        getToolExplanation={getToolExplanation}
        renderToolExplanation={(expl: any) => <Markdown text={expl} />}
        onShowOutput={(result: any) => setOutput(result)}
        translations={{
          error: t("error"),
          success: t("success"),
          outputError: t("outputError"),
          inputStreaming: t("streaming"),
          inputAvailable: t("running"),
        }}
      />

      {output && (
        <ToolCallResultModal
          open
          result={output}
          onClose={() => setOutput(null)}
        />
      )}
    </>
  );
};
