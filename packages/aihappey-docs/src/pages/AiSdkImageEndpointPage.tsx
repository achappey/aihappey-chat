import { ApiEndpointPage, ApiReferenceLayout } from "aihappey-docs-components";
import { createAiSdkImageEndpointDoc, docsTopNavItems, gatewayNavSections } from "../docsData";

export const AiSdkImageEndpointPage = ({ activePath, apiBaseUrl, appTitle }: { activePath: string; apiBaseUrl?: string; appTitle: string }) => {
  return <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Gateway" sections={gatewayNavSections}><ApiEndpointPage endpoint={createAiSdkImageEndpointDoc({ apiBaseUrl })} /></ApiReferenceLayout>;
};

