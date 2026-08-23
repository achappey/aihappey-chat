import { ApiEndpointPage, ApiReferenceLayout } from "aihappey-docs-components";
import { createMessagesEndpointDoc, docsTopNavItems, gatewayNavSections } from "../docsData";

export type MessagesEndpointPageProps = { activePath: string; apiBaseUrl?: string; appTitle: string };

export const MessagesEndpointPage = ({ activePath, apiBaseUrl, appTitle }: MessagesEndpointPageProps) => {
  return (
    <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Gateway" sections={gatewayNavSections}>
      <ApiEndpointPage endpoint={createMessagesEndpointDoc({ apiBaseUrl })} />
    </ApiReferenceLayout>
  );
};

