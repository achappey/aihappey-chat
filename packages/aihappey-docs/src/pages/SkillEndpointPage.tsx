import { ApiEndpointPage, ApiReferenceLayout } from "aihappey-docs-components";
import { useDocsTranslation } from "aihappey-docs-i18n";
import { createSkillEndpointDoc, docsTopNavItems, gatewayNavSections, type SkillEndpoint } from "../docsData";

export const SkillEndpointPage = ({ activePath, apiBaseUrl, appTitle, endpoint }: { activePath: string; apiBaseUrl?: string; appTitle: string; endpoint: SkillEndpoint }) => {
  const { t } = useDocsTranslation();
  return <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Gateway" sections={gatewayNavSections}><ApiEndpointPage endpoint={createSkillEndpointDoc(endpoint, { apiBaseUrl, t })} /></ApiReferenceLayout>;
};
