import { useState } from "react";
import type { DocsEndpointDoc } from "../navigation/types";
import { useDocsTheme } from "../theme/useDocsTheme";
import { docsArticleStyle, docsCodeStyle, docsHeroTextStyle } from "../theme/docsThemeStyles";
import { DocsLink } from "../layout/DocsLink";
import { ApiSection } from "./ApiSection";
import { CodeExample } from "./CodeExample";
import { EndpointTestModal } from "./EndpointTestModal";
import { ParameterTable } from "./ParameterTable";
import { ResponseExample } from "./ResponseExample";

export type ApiEndpointPageProps = {
  endpoint: DocsEndpointDoc;
};

export const ApiEndpointPage = ({ endpoint }: ApiEndpointPageProps) => {
  const { Badge, Button, Header } = useDocsTheme();
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  return (
    <article style={docsArticleStyle}>
      <header style={{ display: "grid", gap: 18 }}>
        <Badge appearance="secondary">{endpoint.surface}</Badge>
        <Header level={1} style={{ fontSize: "clamp(2.4rem, 5vw, 4.6rem)" }}>{endpoint.title}</Header>
        <p style={{ ...docsHeroTextStyle, fontSize: "clamp(1.05rem, 2vw, 1.35rem)", maxWidth: 860 }}>
          {endpoint.summary}
        </p>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Badge appearance="primary">{endpoint.method}</Badge>
          <code style={{ ...docsCodeStyle, padding: "0.45rem 0.7rem", borderRadius: 10, overflowWrap: "anywhere" }}>{endpoint.url ?? endpoint.path}</code>
          {endpoint.test ? (
            <Button
              type="button"
              variant="primary"
              onClick={() => setIsTestModalOpen(true)}
            >
              {endpoint.test.label ?? "Test"}
            </Button>
          ) : null}
        </div>
      </header>

      {endpoint.test ? <EndpointTestModal endpoint={endpoint} show={isTestModalOpen} onHide={() => setIsTestModalOpen(false)} /> : null}

      <ApiSection title="Overview">{endpoint.description}</ApiSection>
      {endpoint.auth ? <ApiSection title="Authentication">{endpoint.auth}</ApiSection> : null}
      {endpoint.parameters?.length ? <ApiSection title="Request body"><ParameterTable parameters={endpoint.parameters} /></ApiSection> : null}
      {endpoint.requestExamples?.length ? <ApiSection title="Request examples"><CodeExample examples={endpoint.requestExamples} /></ApiSection> : null}
      {endpoint.responses?.length ? <ApiSection title="Responses"><ResponseExample responses={endpoint.responses} /></ApiSection> : null}
      {endpoint.errors?.length ? <ApiSection title="Errors"><ResponseExample responses={endpoint.errors} /></ApiSection> : null}
      {endpoint.related?.length ? (
        <ApiSection title="Related">
          <ul style={{ margin: 0, paddingInlineStart: 20 }}>
            {endpoint.related.map((item) => (
              <li key={item.id}><DocsLink href={item.href}>{item.label}</DocsLink></li>
            ))}
          </ul>
        </ApiSection>
      ) : null}
    </article>
  );
};

