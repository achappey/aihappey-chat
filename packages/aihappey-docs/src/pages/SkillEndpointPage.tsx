import { ApiEndpointPage, ApiReferenceLayout } from "aihappey-docs-components";
import { createSkillEndpointDoc, docsTopNavItems, gatewayNavSections, type SkillEndpoint } from "../docsData";

export const SkillEndpointPage = ({ activePath, apiBaseUrl, appTitle, endpoint }: { activePath: string; apiBaseUrl?: string; appTitle: string; endpoint: SkillEndpoint }) => {
  return <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Gateway" sections={gatewayNavSections}><ApiEndpointPage endpoint={createSkillEndpointDoc(endpoint, { apiBaseUrl })} /></ApiReferenceLayout>;
};

