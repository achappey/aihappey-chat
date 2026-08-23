import { ApiEndpointPage, ApiReferenceLayout } from "aihappey-docs-components";
import { useDocsTranslation } from "aihappey-docs-i18n";
import { agentNavSections, createAgentEndpointDoc, docsTopNavItems, type AgentEndpoint } from "../docsData";

export type AgentEndpointPageProps = {
  activePath: string;
  apiBaseUrl?: string;
  appTitle: string;
  endpoint: AgentEndpoint;
};

export const AgentEndpointPage = ({ activePath, apiBaseUrl, appTitle, endpoint }: AgentEndpointPageProps) => {
  const { t } = useDocsTranslation();
  return (
    <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Agent API" sections={agentNavSections}>
      <ApiEndpointPage endpoint={createAgentEndpointDoc(endpoint, { apiBaseUrl, t })} />
    </ApiReferenceLayout>
  );
};

