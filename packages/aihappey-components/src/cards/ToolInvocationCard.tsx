import React, { useState } from "react";
import { useTheme } from "../theme/ThemeContext";
import { CapabilityIcon } from "../images/CapabilityIcon";
import type { Tool } from "aihappey-mcp";
import { ViewButton } from "../buttons/ViewButton";
import { ToolInvocationStateBadge } from "../badges/ToolInvocationStateBadge";
import { formatFileSize } from "./formatFileSize";

export interface ToolInvocationCardProps {
  invocation: {
    type: string;
    input?: any;
    state?: string;
    output?: any;
    toolCallId?: string;
    title?: string;
    providerExecuted?: boolean;
    approval?: {
      id: string,
      approved?: boolean,
      reason?: string
    }
  };
  tool?: Tool;
  providerIcons?: Tool["icons"];
  getToolExplanation?: any;
  renderToolExplanation?: any;
  onShowOutput?: (data: any) => void
}

function prettySize(obj: any) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj)).length;
  return formatFileSize(bytes);
}

export const ToolInvocationCard: React.FC<ToolInvocationCardProps> = ({
  invocation,
  tool,
  providerIcons,
  onShowOutput,
  renderToolExplanation,
  getToolExplanation,
}) => {
  const [explanation, setExplanation] = useState<string | undefined>(undefined);
  const { Card, Button, Spinner, JsonViewer, Badge } = useTheme();
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const toolName = invocation.type.replace("tool-", "");
  const task = invocation?.output?.task as any;

  const toolTitle = invocation?.title ?? tool?.title ?? tool?.name ?? toolName;
  const imageIcons = tool?.icons ?? (invocation.providerExecuted ? providerIcons : undefined);

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
      && <Badge size={"small"} bg="informative">{prettySize(invocation.output)}</Badge>}

    {task && <Badge size={"small"} bg="warning">task: {task.status}</Badge>}
  </div>;

  return (
    <Card
      description={cardDescription}
      title={toolTitle}
      image={<CapabilityIcon icons={imageIcons} />}
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
