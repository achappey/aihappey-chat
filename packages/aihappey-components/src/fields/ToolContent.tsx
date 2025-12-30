import React from "react";
import { useTheme } from "../theme/ThemeContext";
import type { ProgressNotificationParams, Tool } from "@modelcontextprotocol/sdk/types";

export interface ToolContentProps {
  invocation: {
    type: string;
    input?: any;
    state?: string;
    title?: string;
    output?: any;
    toolCallId?: string;
  };
  tool?: Tool;
  translations?: any,
  progress?: ProgressNotificationParams
}

export const ToolContent: React.FC<ToolContentProps> = ({
  invocation,
  translations,
  progress,
  tool
}) => {
  const { JsonViewer, ProgressBar } = useTheme();
  const argsPreview = JSON.stringify(invocation.input, null, 2);
  const toolTitle = invocation?.title ?? tool?.title ?? tool?.name ?? invocation.type.replace("tool-", "");
  const contentStyle: React.CSSProperties = {
    margin: "0.5em 0px"
  }

  return <>
    <p style={contentStyle}>
      <strong>
        {toolTitle}
      </strong>
    </p>

    {tool?.description &&
      <p style={contentStyle}>
        {tool?.description}
      </p>
    }
    <JsonViewer title={translations?.input ?? "input"} value={argsPreview} />

    {progress && <ProgressBar label={progress.message}
      value={progress?.total ? progress.progress / progress.total : progress.progress} />}
  </>
};
