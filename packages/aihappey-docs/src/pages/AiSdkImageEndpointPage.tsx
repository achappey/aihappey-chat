import { ApiEndpointPage, ApiReferenceLayout } from "aihappey-docs-components";
import { useDocsTranslation } from "aihappey-docs-i18n";
import { createAiSdkImageEndpointDoc, docsTopNavItems, gatewayNavSections } from "../docsData";

export const AiSdkImageEndpointPage = ({ activePath, apiBaseUrl, appTitle }: { activePath: string; apiBaseUrl?: string; appTitle: string }) => {
  const { t } = useDocsTranslation();
  return <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Gateway" sections={gatewayNavSections}><ApiEndpointPage endpoint={createAiSdkImageEndpointDoc({ apiBaseUrl, t })} /></ApiReferenceLayout>;
};
