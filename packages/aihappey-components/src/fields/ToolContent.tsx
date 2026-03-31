import React from "react";
import { useTheme } from "../theme/ThemeContext";
import type { ProgressNotificationParams, Tool } from "@modelcontextprotocol/sdk/types";
import { useTranslation } from "aihappey-i18n";

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
  progress?: ProgressNotificationParams
}

export const ToolContent: React.FC<ToolContentProps> = ({
  invocation,
  progress,
  tool
}) => {
  const { JsonViewer, ProgressBar } = useTheme();
  const { t } = useTranslation();
  const argsPreview = JSON.stringify(invocation.input, null, 2);
  const toolTitle = invocation?.title ?? tool?.title ?? tool?.name ?? invocation.type.replace("tool-", "");
  const task = invocation?.output?.task as any;
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

    {task && <p style={contentStyle}>
      <strong>Task</strong>: {task.taskId} · <strong>Status</strong>: {task.status}
    </p>}

    <JsonViewer title={t('input')} value={argsPreview} />

    {progress && <ProgressBar label={progress.message}
      value={progress?.total ? progress.progress / progress.total : progress.progress} />}
  </>
};
