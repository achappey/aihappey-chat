import { ApiEndpointPage, ApiReferenceLayout } from "aihappey-docs-components";
import { createDecisionsEndpointDoc, docsTopNavItems, gatewayNavSections, getAgentNavSections, type DecisionsService, type DecisionsSurface } from "../docsData";
import { useDocsAuthMode } from "../DocsAuthContext";

export type DecisionsEndpointPageProps = {
  activePath: string;
  apiBaseUrl?: string;
  appTitle: string;
  service: DecisionsService;
  surface: DecisionsSurface;
};

export const DecisionsEndpointPage = ({ activePath, apiBaseUrl, appTitle, service, surface }: DecisionsEndpointPageProps) => {
  const authMode = useDocsAuthMode();
  const isAgent = service === "agents";
  return (
    <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle={isAgent ? "Agents API" : "Gateway"} sections={isAgent ? getAgentNavSections(authMode) : gatewayNavSections}>
      <ApiEndpointPage endpoint={createDecisionsEndpointDoc(surface, service, { apiBaseUrl, authMode })} />
    </ApiReferenceLayout>
  );
};
