import { ApiEndpointPage, ApiReferenceLayout } from "aihappey-docs-components";
import { useDocsTranslation } from "aihappey-docs-i18n";
import { createRerankEndpointDoc, docsTopNavItems, gatewayNavSections } from "../docsData";

export type RerankEndpointPageProps = {
  activePath: string;
  apiBaseUrl?: string;
  appTitle: string;
};

export const RerankEndpointPage = ({ activePath, apiBaseUrl, appTitle }: RerankEndpointPageProps) => {
  const { t } = useDocsTranslation();

  return (
    <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Gateway" sections={gatewayNavSections}>
      <ApiEndpointPage endpoint={createRerankEndpointDoc({ apiBaseUrl, t })} />
    </ApiReferenceLayout>
  );
};

