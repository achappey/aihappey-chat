import React, { useState } from "react";
import { useTheme } from "../theme/ThemeContext";
import { CapabilityIcon } from "../images/CapabilityIcon";
import type { Tool } from "@modelcontextprotocol/sdk/types";
import { ViewOutputButton } from "../buttons/ViewOutputButton";
import { ToolInvocationStateBadge } from "../badges/ToolInvocationStateBadge";

export interface ToolInvocationCardProps {
  invocation: {
    type: string;
    input?: any;
    state?: string;
    output?: any;
    toolCallId?: string;
  };
  tool?: Tool;
  getToolExplanation?: any;
  renderToolExplanation?: any;
  onShowOutput?: any
  translations?: any
}

function prettySize(obj: any) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj)).length;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export const ToolInvocationCard: React.FC<ToolInvocationCardProps> = ({
  invocation,
  tool,
  onShowOutput,
  translations,
  renderToolExplanation,
  getToolExplanation,
}) => {
  const [explanation, setExplanation] = useState<string | undefined>(undefined);
  const { Card, Button, Spinner, JsonViewer, Badge, Image } = useTheme();
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const argsPreview = JSON.stringify(invocation.input, null, 2);
  const toolTitle = tool?.title ?? tool?.name ?? invocation.type.replace("tool-", "");
  const cardDescription = <>
    <ToolInvocationStateBadge
      state={invocation.state!}
      output={invocation.output}
      translations={translations} />
    {invocation.state === 'output-available' && !invocation.output?.isError
      && <Badge bg="informative">{prettySize(invocation.output)}</Badge>}
  </>;

  return (
    <Card
      description={cardDescription}
      title={toolTitle}
      image={<CapabilityIcon icons={tool?.icons} />}
      headerActions={
        <>
          {invocation.state?.startsWith("input-") && <Spinner size="small" />}
        </>
      }
      actions={
        <>
          {invocation.state == "output-available"
            && onShowOutput
            && <ViewOutputButton
              disabled={loadingExplanation}
              onClick={() => onShowOutput(invocation?.output)}
            />}
          {getToolExplanation && renderToolExplanation && (
            <Button
              icon="explainTool"
              disabled={loadingExplanation}
              size="small"
              onClick={async () => {
                setLoadingExplanation(true);
                try {
                  const result = await getToolExplanation(invocation, tool);
                  setExplanation(result);
                } finally {
                  setLoadingExplanation(false);
                }
              }}
            ></Button>
          )}

        </>
      }>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div>
          <div>
            {loadingExplanation ? (
              <Spinner size="small" />
            ) : explanation ? (
              renderToolExplanation(explanation)
            ) : (
              <JsonViewer value={argsPreview} />
            )}
          </div>

        </div>
      </div>
    </Card>
  );
};
