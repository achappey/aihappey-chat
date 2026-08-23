import { ApiEndpointPage, ApiReferenceLayout } from "aihappey-docs-components";
import { createUiEndpointDoc, docsTopNavItems, gatewayNavSections } from "../docsData";

export const UiEndpointPage = ({ activePath, apiBaseUrl, appTitle }: { activePath: string; apiBaseUrl?: string; appTitle: string }) => {
  return <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Gateway" sections={gatewayNavSections}><ApiEndpointPage endpoint={createUiEndpointDoc({ apiBaseUrl })} /></ApiReferenceLayout>;
};

