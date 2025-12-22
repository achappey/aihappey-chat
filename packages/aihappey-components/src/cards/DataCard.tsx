import React from "react";
import { useTheme } from "../theme/ThemeContext";

export interface DataCardProps {
  type: string;
  data: any;
}

export const DataCard: React.FC<DataCardProps> = ({
  type,
  data
}) => {
  const { Card, JsonViewer } = useTheme();

  return (
    <Card title={type}>
      <JsonViewer value={JSON.stringify(data)} />
    </Card>
  );
};
