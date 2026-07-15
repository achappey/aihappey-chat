import { ApiEndpointPage, ApiReferenceLayout } from "aihappey-docs-components";
import { useDocsTranslation } from "aihappey-docs-i18n";
import { createVideoEndpointDoc, docsTopNavItems, gatewayNavSections } from "../docsData";

export type VideoEndpointPageProps = {
  activePath: string;
  apiBaseUrl?: string;
  appTitle: string;
};

export const VideoEndpointPage = ({ activePath, apiBaseUrl, appTitle }: VideoEndpointPageProps) => {
  const { t } = useDocsTranslation();

  return (
    <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Gateway" sections={gatewayNavSections}>
      <ApiEndpointPage endpoint={createVideoEndpointDoc({ apiBaseUrl, t })} />
    </ApiReferenceLayout>
  );
};

