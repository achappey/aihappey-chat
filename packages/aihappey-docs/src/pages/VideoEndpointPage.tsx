import { ApiEndpointPage, ApiReferenceLayout } from "aihappey-docs-components";
import { useDocsTranslation } from "aihappey-docs-i18n";
import { createVideoEndpointDoc, docsTopNavItems, gatewayNavSections, type VideoEndpoint } from "../docsData";

export type VideoEndpointPageProps = {
  activePath: string;
  apiBaseUrl?: string;
  appTitle: string;
  endpoint: VideoEndpoint;
};

export const VideoEndpointPage = ({ activePath, apiBaseUrl, appTitle, endpoint }: VideoEndpointPageProps) => {
  const { t } = useDocsTranslation();

  return (
    <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Gateway" sections={gatewayNavSections}>
      <ApiEndpointPage endpoint={createVideoEndpointDoc(endpoint, { apiBaseUrl, t })} />
    </ApiReferenceLayout>
  );
};

