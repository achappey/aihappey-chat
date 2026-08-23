import { ApiEndpointPage, ApiReferenceLayout } from "aihappey-docs-components";
import { createAgentEndpointDoc, docsTopNavItems, getAgentNavSections, type AgentEndpoint } from "../docsData";
import { useDocsAuthMode } from "../DocsAuthContext";

export type AgentEndpointPageProps = {
  activePath: string;
  apiBaseUrl?: string;
  appTitle: string;
  endpoint: AgentEndpoint;
};

export const AgentEndpointPage = ({ activePath, apiBaseUrl, appTitle, endpoint }: AgentEndpointPageProps) => {
  const authMode = useDocsAuthMode();
  return (
    <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Agents API" sections={getAgentNavSections(authMode)}>
      <ApiEndpointPage endpoint={createAgentEndpointDoc(endpoint, { apiBaseUrl, authMode })} />
    </ApiReferenceLayout>
  );
};


