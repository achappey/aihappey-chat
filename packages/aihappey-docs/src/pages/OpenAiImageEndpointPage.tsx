import { ApiEndpointPage, ApiReferenceLayout } from "aihappey-docs-components";
import { createOpenAiImageEndpointDoc, docsTopNavItems, gatewayNavSections } from "../docsData";

export type OpenAiImageEndpointPageProps = {
  activePath: string;
  apiBaseUrl?: string;
  appTitle: string;
  endpoint: "generation" | "edit";
};

export const OpenAiImageEndpointPage = ({ activePath, apiBaseUrl, appTitle, endpoint }: OpenAiImageEndpointPageProps) => {

  return (
    <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Gateway" sections={gatewayNavSections}>
      <ApiEndpointPage endpoint={createOpenAiImageEndpointDoc(endpoint, { apiBaseUrl })} />
    </ApiReferenceLayout>
  );
};


