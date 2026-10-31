import { ApiEndpointPage, ApiReferenceLayout } from "aihappey-docs-components";
import { createGenericRealtimeEndpointDoc, createLiveSessionEndpointDoc, createRealtimeEndpointDoc, docsTopNavItems, gatewayNavSections, type GenericRealtimeEndpoint } from "../docsData";
import { useDocsAuthMode } from "../DocsAuthContext";

export type RealtimeEndpointPageProps = {
  activePath: string;
  apiBaseUrl?: string;
  appTitle: string;
  endpoint?: "client-secrets" | GenericRealtimeEndpoint | "live";
};

export const RealtimeEndpointPage = ({ activePath, apiBaseUrl, appTitle, endpoint = "client-secrets" }: RealtimeEndpointPageProps) => {
  const authMode = useDocsAuthMode();
  const doc = endpoint === "client-secrets" ? createRealtimeEndpointDoc({ apiBaseUrl })
    : endpoint === "live" ? createLiveSessionEndpointDoc({ apiBaseUrl, authMode })
    : createGenericRealtimeEndpointDoc(endpoint, { apiBaseUrl, authMode });
  return (
    <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Gateway" sections={gatewayNavSections}>
      <ApiEndpointPage endpoint={doc} />
    </ApiReferenceLayout>
  );
};


