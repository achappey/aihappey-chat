import { ApiEndpointPage, ApiReferenceLayout } from "aihappey-docs-components";
import { useDocsTranslation } from "aihappey-docs-i18n";
import { createResponsesEndpointDoc, docsTopNavItems, gatewayNavSections } from "../docsData";

export type ResponsesEndpointPageProps = {
  activePath: string;
  apiBaseUrl?: string;
  appTitle: string;
};

export const ResponsesEndpointPage = ({ activePath, apiBaseUrl, appTitle }: ResponsesEndpointPageProps) => {
  const { t } = useDocsTranslation();

  return (
    <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Gateway" sections={gatewayNavSections}>
      <ApiEndpointPage endpoint={createResponsesEndpointDoc({ apiBaseUrl, t })} />
    </ApiReferenceLayout>
  );
};

