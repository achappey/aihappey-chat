import React from "react";
import { useTheme } from "../theme/ThemeContext";
import type { CreateMessageRequest, CreateMessageResult } from "@modelcontextprotocol/sdk/types";
import { ViewButton } from "../buttons";

export interface SamplingCardProps {
  result?: CreateMessageResult
  request: CreateMessageRequest
  title?: string
}

export const SamplingCard: React.FC<SamplingCardProps> = ({
  result,
  request,
  title,
}) => {
  const { Card, JsonViewer } = useTheme();

  const actions = result
    && <ViewButton />

  return (
    <Card
      actions={actions}
      description={request?.params.modelPreferences?.hints?.[0].name}
      title={title}>
      <JsonViewer value={JSON.stringify(request.params, null, 2)} />
    </Card>
  );
};
