import { ApiEndpointPage, ApiReferenceLayout } from "aihappey-docs-components";
import { createStreamingTranscriptionsEndpointDoc, docsTopNavItems, gatewayNavSections } from "../docsData";

export type StreamingTranscriptionsEndpointPageProps = {
  activePath: string;
  apiBaseUrl?: string;
  appTitle: string;
};

export const StreamingTranscriptionsEndpointPage = ({ activePath, apiBaseUrl, appTitle }: StreamingTranscriptionsEndpointPageProps) => {

  return (
    <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Gateway" sections={gatewayNavSections}>
      <ApiEndpointPage endpoint={createStreamingTranscriptionsEndpointDoc({ apiBaseUrl })} />
    </ApiReferenceLayout>
  );
};

