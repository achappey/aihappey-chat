import { ApiEndpointPage, ApiReferenceLayout } from "aihappey-docs-components";
import { agentNavSections, createAgentEndpointDoc, docsTopNavItems, type AgentEndpoint } from "../docsData";

export type AgentEndpointPageProps = {
  activePath: string;
  apiBaseUrl?: string;
  appTitle: string;
  endpoint: AgentEndpoint;
};

export const AgentEndpointPage = ({ activePath, apiBaseUrl, appTitle, endpoint }: AgentEndpointPageProps) => {
  return (
    <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Agent API" sections={agentNavSections}>
      <ApiEndpointPage endpoint={createAgentEndpointDoc(endpoint, { apiBaseUrl })} />
    </ApiReferenceLayout>
  );
};


