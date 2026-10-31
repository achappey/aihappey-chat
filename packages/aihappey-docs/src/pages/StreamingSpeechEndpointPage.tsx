import { ApiEndpointPage, ApiReferenceLayout } from "aihappey-docs-components";
import { createStreamingSpeechEndpointDoc, docsTopNavItems, gatewayNavSections } from "../docsData";
import { useDocsAuthMode } from "../DocsAuthContext";

export type StreamingSpeechEndpointPageProps = {
  activePath: string;
  apiBaseUrl?: string;
  appTitle: string;
};

export const StreamingSpeechEndpointPage = ({ activePath, apiBaseUrl, appTitle }: StreamingSpeechEndpointPageProps) => {
  const authMode = useDocsAuthMode();
  return (
    <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Gateway" sections={gatewayNavSections}>
      <ApiEndpointPage endpoint={createStreamingSpeechEndpointDoc({ apiBaseUrl, authMode })} />
    </ApiReferenceLayout>
  );
};
