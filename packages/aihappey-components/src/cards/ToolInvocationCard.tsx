import React, { useState } from "react";
import { useTheme } from "../theme/ThemeContext";
import { CapabilityIcon } from "../images/CapabilityIcon";
import type { Tool } from "aihappey-mcp";
import { ViewButton } from "../buttons/ViewButton";
import { ToolInvocationStateBadge } from "../badges/ToolInvocationStateBadge";

export interface ToolInvocationCardProps {
  invocation: {
    type: string;
    input?: any;
    state?: string;
    output?: any;
    toolCallId?: string;
    title?: string;
    approval?: {
      id: string,
      approved?: boolean,
      reason?: string
    }
  };
  tool?: Tool;
  getToolExplanation?: any;
  renderToolExplanation?: any;
  onShowOutput?: (data: any) => void
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
  renderToolExplanation,
  getToolExplanation,
}) => {
  const [explanation, setExplanation] = useState<string | undefined>(undefined);
  const { Card, Button, Spinner, JsonViewer, Badge, Image } = useTheme();
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const toolName = invocation.type.replace("tool-", "");

  const toolTitle = invocation?.title ?? tool?.title ?? tool?.name ?? toolName;

  const isCompleted = invocation.state === 'approval-responded'
    || invocation.state === 'output-available';

  const cardDescription = <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
    <ToolInvocationStateBadge
      state={invocation.state!}
      toolName={toolName}
      toolTitle={invocation?.title}
      approval={invocation.approval}
      isError={invocation.output?.isError} />

    {isCompleted && !invocation.output?.isError
      && <Badge bg="informative">{prettySize(invocation.output)}</Badge>}
  </div>;

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
          {isCompleted
            && onShowOutput
            && <ViewButton
              disabled={loadingExplanation}
              size="small"
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
              <JsonViewer value={invocation.input} />
            )}
          </div>

        </div>
      </div>
    </Card>
  );
};
