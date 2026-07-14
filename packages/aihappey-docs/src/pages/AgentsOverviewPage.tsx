import { ApiReferenceLayout, ApiSection } from "aihappey-docs-components";
import { agentNavSections, docsTopNavItems } from "../docsData";

export type AgentsOverviewPageProps = {
  activePath: string;
  appTitle: string;
};

export const AgentsOverviewPage = ({ activePath, appTitle }: AgentsOverviewPageProps) => (
  <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Agent API" sections={agentNavSections}>
    <article style={{ maxWidth: 980, padding: "clamp(2rem, 5vw, 5rem)", display: "grid", gap: 42 }}>
      <header style={{ display: "grid", gap: 18 }}>
        <h1 style={{ margin: 0, fontSize: "clamp(2.6rem, 6vw, 5rem)", letterSpacing: "-0.06em" }}>Agent API Overview</h1>
        <p style={{ margin: 0, fontSize: "clamp(1.1rem, 2vw, 1.35rem)", lineHeight: 1.7, opacity: 0.76 }}>
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

