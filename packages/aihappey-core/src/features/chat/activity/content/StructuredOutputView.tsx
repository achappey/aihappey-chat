import { useTranslation } from "aihappey-i18n";
import { StructuredContentCard, useTheme } from "aihappey-components";

import { ToolCallResult } from "aihappey-types";

interface StructuredOutputViewProps {
  result: ToolCallResult;
}

export const StructuredOutputView = ({ result }: StructuredOutputViewProps) => {
  const { t } = useTranslation();

  return (
    <StructuredContentCard
      title={t("mcp.structuredContent")}
      result={result}
    />
  );
};
