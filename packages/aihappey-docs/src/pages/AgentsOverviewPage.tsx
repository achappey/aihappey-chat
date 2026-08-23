import { ApiReferenceLayout, ApiSection, docsArticleStyle, docsHeroTextStyle, docsHeroTitleStyle, useDocsTheme } from "aihappey-docs-components";
import { docsContent } from "../docsContent";
import { agentNavSections, docsTopNavItems } from "../docsData";

export type AgentsOverviewPageProps = {
  activePath: string;
  appTitle: string;
};

export const AgentsOverviewPage = ({ activePath, appTitle }: AgentsOverviewPageProps) => {
  const { Header } = useDocsTheme();
  const content = docsContent.agents.overview;

  return (
    <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Agent API" sections={agentNavSections}>
      <article style={docsArticleStyle}>
        <header style={{ display: "grid", gap: 18 }}>
          <Header level={1} style={docsHeroTitleStyle}>{content.title}</Header>
          <p style={docsHeroTextStyle}>{content.summary}</p>
        </header>
        <ApiSection title={content.startTitle}>
          <p style={{ margin: 0 }}>{content.start}</p>
        </ApiSection>
        <ApiSection title={content.authTitle}>
          <p id="authentication" style={{ margin: 0 }}>{content.auth}</p>
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


