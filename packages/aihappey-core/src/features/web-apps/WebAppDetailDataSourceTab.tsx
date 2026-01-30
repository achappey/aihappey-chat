import type { JsonRenderAppDataSource } from "aihappey-json-render-apps";
import { useTranslation } from "aihappey-i18n";
import { DataSourceForm, useTheme } from "aihappey-components";

type WebAppDetailDataSourceTabProps = {
  dataSourceValue: JsonRenderAppDataSource | null;
  dataSourceError?: string;
  connectedServerKeys: string[];
  resourceOptions: any[];
  resourceTemplateOptions: any[];
  toolOptions: any[];
  structuredOutputOptions: any[];
  modelOptions: any[];
  onDataSourceChange: (next: JsonRenderAppDataSource | null) => void;
};

export const WebAppDetailDataSourceTab = ({
  dataSourceValue,
  dataSourceError,
  connectedServerKeys,
  resourceOptions,
  resourceTemplateOptions,
  toolOptions,
  structuredOutputOptions,
  modelOptions,
  onDataSourceChange,
}: WebAppDetailDataSourceTabProps) => {
  const { t } = useTranslation();
  const { Alert } = useTheme();

  return (
    <div
      style={{
        width: "100%",
        paddingTop: 12,
        maxWidth: 700,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {dataSourceError ? (
        <Alert variant="warning">{dataSourceError}</Alert>
      ) : null}
      {connectedServerKeys.length === 0 ? (
        <Alert variant="warning">{t("dataSource.mcpDisconnected")}</Alert>
      ) : null}
      <DataSourceForm
        value={dataSourceValue}
        onChange={onDataSourceChange}
        resourceOptions={resourceOptions}
        resourceTemplateOptions={resourceTemplateOptions}
        toolOptions={toolOptions}
        structuredOutputOptions={structuredOutputOptions}
        modelOptions={modelOptions}
      />
    </div>
  );
};
