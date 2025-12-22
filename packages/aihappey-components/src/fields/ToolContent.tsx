import React from "react";
import { useTheme } from "../theme/ThemeContext";
import type { Tool } from "@modelcontextprotocol/sdk/types";

export interface ToolContentProps {
  invocation: {
    type: string;
    input?: any;
    state?: string;
    output?: any;
    toolCallId?: string;
  };
  tool?: Tool;
  translations?: any
}


export const ToolContent: React.FC<ToolContentProps> = ({
  invocation,
  translations,
  tool
}) => {
  const { JsonViewer } = useTheme();
  const argsPreview = JSON.stringify(invocation.input, null, 2);
  const toolTitle = tool?.title ?? tool?.name ?? invocation.type.replace("tool-", "");

  return <>
    <p style={{ margin: "0.5em 0px" }}>
      <strong>
        {toolTitle}
      </strong>
    </p>

    <JsonViewer title={translations?.input ?? "input"} value={argsPreview} />
  </>
};
