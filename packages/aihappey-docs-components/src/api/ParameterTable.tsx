import type { DocsParameter } from "../navigation/types";
import { docsInlineCodeStyle } from "../theme/docsThemeStyles";
import { useDocsTheme } from "../theme/useDocsTheme";

export type ParameterTableProps = {
  parameters: DocsParameter[];
};

export const ParameterTable = ({ parameters }: ParameterTableProps) => {
  const { Badge, Table } = useDocsTheme();

  return (
    <Table>
      <thead>
        <tr>
          <th style={{ textAlign: "left", padding: 12 }}>Name</th>
          <th style={{ textAlign: "left", padding: 12 }}>Type</th>
          <th style={{ textAlign: "left", padding: 12 }}>Required</th>
          <th style={{ textAlign: "left", padding: 12 }}>Description</th>
        </tr>
      </thead>
      <tbody>
        {parameters.map((parameter) => (
          <tr key={parameter.name}>
            <td style={{ padding: 12 }}><code style={docsInlineCodeStyle}>{parameter.name}</code></td>
            <td style={{ padding: 12 }}><code style={docsInlineCodeStyle}>{parameter.type}</code></td>
            <td style={{ padding: 12 }}>
              <Badge appearance={parameter.required ? "primary" : "secondary"}>{parameter.required ? "Required" : "Optional"}</Badge>
            </td>
            <td style={{ padding: 12 }}>{parameter.description}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

