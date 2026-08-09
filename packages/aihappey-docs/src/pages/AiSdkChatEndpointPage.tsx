import { ApiEndpointPage, ApiReferenceLayout } from "aihappey-docs-components";
import { useDocsTranslation } from "aihappey-docs-i18n";
import { createAiSdkChatEndpointDoc, docsTopNavItems, gatewayNavSections } from "../docsData";

export type AiSdkChatEndpointPageProps = { activePath: string; apiBaseUrl?: string; appTitle: string };

export const AiSdkChatEndpointPage = ({ activePath, apiBaseUrl, appTitle }: AiSdkChatEndpointPageProps) => {
  const { t } = useDocsTranslation();
  return (
    <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Gateway" sections={gatewayNavSections}>
      <ApiEndpointPage endpoint={createAiSdkChatEndpointDoc({ apiBaseUrl, t })} />
    </ApiReferenceLayout>
  );
};
