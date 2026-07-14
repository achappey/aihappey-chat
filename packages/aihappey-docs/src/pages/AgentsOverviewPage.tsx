import { ApiReferenceLayout, ApiSection, docsArticleStyle, docsHeroTextStyle, docsHeroTitleStyle, useDocsTheme } from "aihappey-docs-components";
import { agentNavSections, docsTopNavItems } from "../docsData";

export type AgentsOverviewPageProps = {
  activePath: string;
  appTitle: string;
};

export const AgentsOverviewPage = ({ activePath, appTitle }: AgentsOverviewPageProps) => {
  const { Header } = useDocsTheme();

  return (
    <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Agent API" sections={agentNavSections}>
      <article style={docsArticleStyle}>
        <header style={{ display: "grid", gap: 18 }}>
          <Header level={1} style={docsHeroTitleStyle}>Agent API Overview</Header>
          <p style={docsHeroTextStyle}>
            A separate reference space for agent runtime and management endpoints, with its own navigation independent of the gateway docs.
          </p>
        </header>
        <ApiSection title="Start here">
          <p style={{ margin: 0 }}>Agent API docs will cover runs, events, tools, memory, and definitions without mixing those routes into the gateway endpoint navigation.</p>
        </ApiSection>
        <ApiSection title="Structure">
          <p style={{ margin: 0 }}>This page establishes the separate Agent API shell now; endpoint pages can be filled out after the gateway speech pattern is approved.</p>
        </ApiSection>
      </article>
    </ApiReferenceLayout>
  );
};

