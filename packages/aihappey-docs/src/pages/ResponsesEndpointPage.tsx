import { ApiEndpointPage, ApiReferenceLayout } from "aihappey-docs-components";
import { createResponsesEndpointDoc, docsTopNavItems, gatewayNavSections } from "../docsData";

export type ResponsesEndpointPageProps = {
  activePath: string;
  apiBaseUrl?: string;
  appTitle: string;
};

export const ResponsesEndpointPage = ({ activePath, apiBaseUrl, appTitle }: ResponsesEndpointPageProps) => {

  return (
    <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Gateway" sections={gatewayNavSections}>
      <ApiEndpointPage endpoint={createResponsesEndpointDoc({ apiBaseUrl })} />
    </ApiReferenceLayout>
  );
};


