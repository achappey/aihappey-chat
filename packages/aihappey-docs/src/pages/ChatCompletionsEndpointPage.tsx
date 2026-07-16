import { ApiEndpointPage, ApiReferenceLayout } from "aihappey-docs-components";
import { useDocsTranslation } from "aihappey-docs-i18n";
import { createChatCompletionsEndpointDoc, docsTopNavItems, gatewayNavSections } from "../docsData";

export type ChatCompletionsEndpointPageProps = {
  activePath: string;
  apiBaseUrl?: string;
  appTitle: string;
};

export const ChatCompletionsEndpointPage = ({ activePath, apiBaseUrl, appTitle }: ChatCompletionsEndpointPageProps) => {
  const { t } = useDocsTranslation();

  return (
    <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Gateway" sections={gatewayNavSections}>
      <ApiEndpointPage endpoint={createChatCompletionsEndpointDoc({ apiBaseUrl, t })} />
    </ApiReferenceLayout>
  );
};

