import { ApiReferenceLayout, ApiSection, docsArticleStyle, docsCodeStyle, docsHeroTextStyle, docsHeroTitleStyle, docsInlineCodeStyle, useDocsTheme } from "aihappey-docs-components";
import { docsContent } from "../docsContent";
import { docsTopNavItems, getAgentNavSections } from "../docsData";
import { useDocsAuthMode } from "../DocsAuthContext";

export type AgentsOverviewPageProps = {
  activePath: string;
  appTitle: string;
  apiBaseUrl?: string;
};

export const AgentsOverviewPage = ({ activePath, appTitle, apiBaseUrl }: AgentsOverviewPageProps) => {
  const { Header } = useDocsTheme();
  const content = docsContent.agents.overview;
  const authMode = useDocsAuthMode();
  const baseUrl = apiBaseUrl?.trim().replace(/\/+$/, "") || "http://localhost:3036";

  return (
    <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Agents API" sections={getAgentNavSections(authMode)}>
      <article style={docsArticleStyle}>
        <header style={{ display: "grid", gap: 18 }}>
          <Header level={1} style={docsHeroTitleStyle}>{content.title}</Header>
          <p style={docsHeroTextStyle}>{content.summary}</p>
        </header>
        <ApiSection title={content.startTitle}>
          <p style={{ margin: 0 }}>{content.start}</p>
        </ApiSection>
        <ApiSection title={content.authTitle}>
          <div id="authentication" style={{ display: "grid", gap: 16 }}>
            {authMode === "provider-key" ? <>
              <p style={{ margin: 0 }}>This app uses raw downstream provider keys. Send <code style={docsInlineCodeStyle}>X-&lt;ProviderId&gt;-Key</code> for every provider used by the selected agent or workflow. Agent hosts forward these headers to the Gateway.</p>
              <p style={{ margin: 0 }}>A bearer provider key is only a single-provider compatibility shortcut. Multi-agent workflows can resolve different providers, so use explicit provider headers and include all required keys on the original Agents API request.</p>
              <pre style={{ ...docsCodeStyle, margin: 0, padding: 16, borderRadius: 12, overflow: "auto" }}>{`curl ${baseUrl}/v1/responses \\\n  -H "X-OpenAI-Key: $OPENAI_API_KEY" \\\n  -H "X-Anthropic-Key: $ANTHROPIC_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"models":["ResearchAgent","ReviewAgent"],"input":"Research and review this topic."}'`}</pre>
              <p style={{ margin: 0 }}>The agent catalog route can be called without a provider key when the host exposes static agent definitions. Execution still requires every key used by the agents’ underlying provider-qualified models.</p>
            </> : <p style={{ margin: 0 }}>{content.auth}</p>}
          </div>
        </ApiSection>
        <ApiSection title={content.executionTitle}>
          <p style={{ margin: 0 }}>{content.execution}</p>
        </ApiSection>
        <ApiSection title={content.responsesTitle}>
          <p style={{ margin: 0 }}>{content.responses}</p>
        </ApiSection>
      </article>
    </ApiReferenceLayout>
  );
};



