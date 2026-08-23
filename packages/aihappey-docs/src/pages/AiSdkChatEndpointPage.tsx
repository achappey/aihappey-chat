import { ApiEndpointPage, ApiReferenceLayout } from "aihappey-docs-components";
import { createAiSdkChatEndpointDoc, docsTopNavItems, gatewayNavSections } from "../docsData";

export type AiSdkChatEndpointPageProps = { activePath: string; apiBaseUrl?: string; appTitle: string };

export const AiSdkChatEndpointPage = ({ activePath, apiBaseUrl, appTitle }: AiSdkChatEndpointPageProps) => {
  return (
    <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Gateway" sections={gatewayNavSections}>
      <ApiEndpointPage endpoint={createAiSdkChatEndpointDoc({ apiBaseUrl })} />
    </ApiReferenceLayout>
  );
};

