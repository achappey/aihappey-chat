import type { DocsParameter } from "../navigation/types";
import { docsInlineCodeStyle } from "../theme/docsThemeStyles";
import { useDocsTheme } from "../theme/useDocsTheme";
import { useDocsTranslation } from "aihappey-docs-i18n";

export type ParameterTableProps = {
  parameters: DocsParameter[];
};

export const ParameterTable = ({ parameters }: ParameterTableProps) => {
  const { Badge, Table } = useDocsTheme();
  const { t } = useDocsTranslation();

  return (
    <Table>
      <thead>
        <tr>
          <th style={{ textAlign: "left", padding: 12 }}>{t("api.table.name")}</th>
          <th style={{ textAlign: "left", padding: 12 }}>{t("api.table.type")}</th>
          <th style={{ textAlign: "left", padding: 12 }}>{t("api.table.required")}</th>
          <th style={{ textAlign: "left", padding: 12 }}>{t("api.table.description")}</th>
        </tr>
      </thead>
      <tbody>
        {parameters.map((parameter) => (
          <tr key={parameter.name}>
            <td style={{ padding: 12 }}><code style={docsInlineCodeStyle}>{parameter.name}</code></td>
            <td style={{ padding: 12 }}><code style={docsInlineCodeStyle}>{parameter.type}</code></td>
            <td style={{ padding: 12 }}>
              <Badge appearance={parameter.required ? "primary" : "secondary"}>{parameter.required ? t("api.table.required") : t("api.table.optional")}</Badge>
            </td>
            <td style={{ padding: 12 }}>{parameter.description}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

