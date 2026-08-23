import { ApiEndpointPage, ApiReferenceLayout } from "aihappey-docs-components";
import { createChatCompletionsEndpointDoc, docsTopNavItems, gatewayNavSections } from "../docsData";

export type ChatCompletionsEndpointPageProps = {
  activePath: string;
  apiBaseUrl?: string;
  appTitle: string;
};

export const ChatCompletionsEndpointPage = ({ activePath, apiBaseUrl, appTitle }: ChatCompletionsEndpointPageProps) => {

  return (
    <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Gateway" sections={gatewayNavSections}>
      <ApiEndpointPage endpoint={createChatCompletionsEndpointDoc({ apiBaseUrl })} />
    </ApiReferenceLayout>
  );
};


