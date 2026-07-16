import { ApiEndpointPage, ApiReferenceLayout } from "aihappey-docs-components";
import { useDocsTranslation } from "aihappey-docs-i18n";
import { createModelsEndpointDoc, docsTopNavItems, gatewayNavSections } from "../docsData";

export type ModelsEndpointPageProps = {
  activePath: string;
  apiBaseUrl?: string;
  appTitle: string;
};

export const ModelsEndpointPage = ({ activePath, apiBaseUrl, appTitle }: ModelsEndpointPageProps) => {
  const { t } = useDocsTranslation();

  return (
    <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Gateway" sections={gatewayNavSections}>
      <ApiEndpointPage endpoint={createModelsEndpointDoc({ apiBaseUrl, t })} />
    </ApiReferenceLayout>
  );
};

