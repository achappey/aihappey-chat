import { ApiReferenceLayout, ApiSection, docsArticleStyle, docsHeroTextStyle, docsHeroTitleStyle, useDocsTheme } from "aihappey-docs-components";
import { docsTopNavItems, gatewayNavSections } from "../docsData";

export type GatewayOverviewPageProps = {
  activePath: string;
  appTitle: string;
};

export const GatewayOverviewPage = ({ activePath, appTitle }: GatewayOverviewPageProps) => {
  const { Header } = useDocsTheme();

  return (
    <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Gateway" sections={gatewayNavSections}>
      <article style={docsArticleStyle}>
        <header style={{ display: "grid", gap: 18 }}>
          <Header level={1} style={docsHeroTitleStyle}>Gateway API Overview</Header>
          <p style={docsHeroTextStyle}>
            Use this reference to look up gateway endpoints, request and response schemas, client examples, streaming behavior,
            authentication, errors, and compatibility surfaces.
          </p>
        </header>
        <ApiSection title="Start here">
          <ol style={{ margin: 0, paddingInlineStart: 24, display: "grid", gap: 16 }}>
            <li>Choose the API surface: OpenAI compatible, Anthropic compatible, or AI SDK.</li>
            <li>Create credentials and pass them as a bearer token to gateway routes.</li>
            <li>Start with a worked endpoint such as speech, then repeat the pattern for the remaining endpoints.</li>
          </ol>
        </ApiSection>
        <ApiSection title="Compatibility sections">
          <p style={{ margin: 0 }}>The side navigation is intentionally grouped by compatibility surface so users can find the endpoint shape that matches their client.</p>
        </ApiSection>
        <ApiSection title="Errors">
          <p style={{ margin: 0 }}>Gateway endpoints should document validation, authentication, provider, and rate-limit errors consistently across every endpoint page.</p>
        </ApiSection>
      </article>
    </ApiReferenceLayout>
  );
};

