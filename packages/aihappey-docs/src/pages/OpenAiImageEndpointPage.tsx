import { ApiEndpointPage, ApiReferenceLayout } from "aihappey-docs-components";
import { useDocsTranslation } from "aihappey-docs-i18n";
import { createOpenAiImageEndpointDoc, docsTopNavItems, gatewayNavSections } from "../docsData";

export type OpenAiImageEndpointPageProps = {
  activePath: string;
  apiBaseUrl?: string;
  appTitle: string;
  endpoint: "generation" | "edit" | "variation";
};

export const OpenAiImageEndpointPage = ({ activePath, apiBaseUrl, appTitle, endpoint }: OpenAiImageEndpointPageProps) => {
  const { t } = useDocsTranslation();

  return (
    <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Gateway" sections={gatewayNavSections}>
      <ApiEndpointPage endpoint={createOpenAiImageEndpointDoc(endpoint, { apiBaseUrl, t })} />
    </ApiReferenceLayout>
  );
};

