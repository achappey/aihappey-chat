import { ApiReferenceLayout, ApiSection } from "aihappey-docs-components";
import { docsTopNavItems, gatewayNavSections } from "../docsData";

export type GatewayOverviewPageProps = {
  activePath: string;
  appTitle: string;
};

export const GatewayOverviewPage = ({ activePath, appTitle }: GatewayOverviewPageProps) => (
  <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Gateway" sections={gatewayNavSections}>
    <article style={{ maxWidth: 980, padding: "clamp(2rem, 5vw, 5rem)", display: "grid", gap: 42 }}>
      <header style={{ display: "grid", gap: 18 }}>
        <h1 style={{ margin: 0, fontSize: "clamp(2.6rem, 6vw, 5rem)", letterSpacing: "-0.06em" }}>Gateway API Overview</h1>
        <p style={{ margin: 0, fontSize: "clamp(1.1rem, 2vw, 1.35rem)", lineHeight: 1.7, opacity: 0.76 }}>
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

