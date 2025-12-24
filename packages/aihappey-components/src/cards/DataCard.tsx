import React from "react";
import { useTheme } from "../theme/ThemeContext";
import type { DataUIPart } from "aihappey-ai";

export interface DataCardProps {
  block: DataUIPart<any>
}

export const DataCard: React.FC<DataCardProps> = ({
  block

}) => {
  const { Card, JsonViewer } = useTheme();

  return (
    <Card title={block.type}>
      <JsonViewer value={block?.data} />
    </Card>
  );
};
