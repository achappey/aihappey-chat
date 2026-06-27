import React, { useState } from "react";
import { ToolInvocationCard as ToolInvocationCardComponent } from "aihappey-components";
import { ToolCallResultModal } from "./ToolCallResultModal";
import { languageNames, useTranslation } from "aihappey-i18n";
import { explainToolCall } from "../../../../runtime/chat-app/explainToolCall";
import { Markdown } from "../../../../ui/markdown/Markdown";
import { useChatContext } from "../../context/ChatContext";
import { useProviderRegistry } from "../../../../runtime/providers/useProviderRegistry";

export interface ToolInvocationCardProps {
  invocation: any;
  tool?: any;
  providerIcons?: any;
}

export const ToolInvocationCard: React.FC<ToolInvocationCardProps> = ({
  invocation,
  tool,
  providerIcons,
}) => {
  const { i18n, t } = useTranslation();
  const { config } = useChatContext();
  const providers = useProviderRegistry();
  const [output, setOutput] = useState<any | null>(null);
  const getToolExplanation = async (invocation: any, tool: any) => await explainToolCall(
    JSON.stringify({ toolcall: invocation, tool }),
    (languageNames as any)[i18n.language as any] ?? i18n.language,
    {
      baseUrl: config.baseUrl,
      fetch: config.fetch,
      getAccessToken: config.getAccessToken,
      providers,
      fallback: t("sideInference.toolExplanationFallback") ?? "The tool call could not be explained.",
    }
  );

  return (
    <>
      <ToolInvocationCardComponent
        invocation={invocation}
        tool={tool}
        providerIcons={providerIcons}
        getToolExplanation={getToolExplanation}
        renderToolExplanation={(expl: any) => <Markdown text={expl} />}
        onShowOutput={(result: any) => setOutput(result)}
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
