import type { DocsEndpointResponse } from "../navigation/types";
import { useDocsTheme } from "../theme/useDocsTheme";
import { CodeExample } from "./CodeExample";

export type ResponseExampleProps = {
  responses: DocsEndpointResponse[];
};

export const ResponseExample = ({ responses }: ResponseExampleProps) => {
  const { Badge, Card } = useDocsTheme();

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {responses.map((response) => (
        <Card key={response.status} title={<><Badge>{response.status}</Badge> Response</>}>
          <div style={{ display: "grid", gap: 12 }}>
            <div>{response.description}</div>
            {response.example ? <CodeExample examples={[response.example]} /> : null}
          </div>
        </Card>
      ))}
    </div>
  );
};

