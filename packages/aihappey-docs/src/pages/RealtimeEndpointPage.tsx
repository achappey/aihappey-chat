import { ApiEndpointPage, ApiReferenceLayout } from "aihappey-docs-components";
import { createRealtimeEndpointDoc, docsTopNavItems, gatewayNavSections } from "../docsData";

export type RealtimeEndpointPageProps = {
  activePath: string;
  apiBaseUrl?: string;
  appTitle: string;
};

export const RealtimeEndpointPage = ({ activePath, apiBaseUrl, appTitle }: RealtimeEndpointPageProps) => {

  return (
    <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Gateway" sections={gatewayNavSections}>
      <ApiEndpointPage endpoint={createRealtimeEndpointDoc({ apiBaseUrl })} />
    </ApiReferenceLayout>
  );
};


