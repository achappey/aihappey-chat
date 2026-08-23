import { ApiEndpointPage, ApiReferenceLayout } from "aihappey-docs-components";
import { createModelsEndpointDoc, docsTopNavItems, gatewayNavSections } from "../docsData";

export type ModelsEndpointPageProps = {
  activePath: string;
  apiBaseUrl?: string;
  appTitle: string;
};

export const ModelsEndpointPage = ({ activePath, apiBaseUrl, appTitle }: ModelsEndpointPageProps) => {

  return (
    <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Gateway" sections={gatewayNavSections}>
      <ApiEndpointPage endpoint={createModelsEndpointDoc({ apiBaseUrl })} />
    </ApiReferenceLayout>
  );
};


