import { ApiEndpointPage, ApiReferenceLayout } from "aihappey-docs-components";
import { useDocsTranslation } from "aihappey-docs-i18n";
import { createMessagesEndpointDoc, docsTopNavItems, gatewayNavSections } from "../docsData";

export type MessagesEndpointPageProps = { activePath: string; apiBaseUrl?: string; appTitle: string };

export const MessagesEndpointPage = ({ activePath, apiBaseUrl, appTitle }: MessagesEndpointPageProps) => {
  const { t } = useDocsTranslation();
  return (
    <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Gateway" sections={gatewayNavSections}>
      <ApiEndpointPage endpoint={createMessagesEndpointDoc({ apiBaseUrl, t })} />
    </ApiReferenceLayout>
  );
};
