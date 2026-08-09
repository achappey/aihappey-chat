
import { useState } from "react";
import type { DocsEndpointDoc } from "../navigation/types";
import { useDocsTheme } from "../theme/useDocsTheme";
import { docsArticleStyle, docsCodeStyle, docsHeroTextStyle, getDocsMethodBadgeProps } from "../theme/docsThemeStyles";
import { DocsLink } from "../layout/DocsLink";
import { useDocsTranslation } from "aihappey-docs-i18n";
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
  const { t } = useDocsTranslation();
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
          <Badge {...getDocsMethodBadgeProps(endpoint.method)}>{endpoint.method}</Badge>
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

      <ApiSection title={t("api.sections.overview")}>{endpoint.description}</ApiSection>
      {endpoint.auth ? <ApiSection title={t("api.sections.authentication")}>{endpoint.auth}</ApiSection> : null}
      {endpoint.parameters?.length ? <ApiSection title={endpoint.parametersTitle ?? t("api.sections.requestBody")}><ParameterTable parameters={endpoint.parameters} /></ApiSection> : null}
      {endpoint.requestExamples?.length ? <ApiSection title={t("api.sections.requestExamples")}><CodeExample examples={endpoint.requestExamples} /></ApiSection> : null}
      {endpoint.responses?.length ? <ApiSection title={t("api.sections.responses")}><ResponseExample responses={endpoint.responses} /></ApiSection> : null}
      {endpoint.errors?.length ? <ApiSection title={t("api.sections.errors")}><ResponseExample responses={endpoint.errors} /></ApiSection> : null}
      {endpoint.related?.length ? (
        <ApiSection title={t("api.sections.related")}>
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

