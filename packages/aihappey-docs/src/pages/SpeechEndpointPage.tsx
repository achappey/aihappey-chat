import { ApiEndpointPage, ApiReferenceLayout } from "aihappey-docs-components";
import { createSpeechEndpointDoc, docsTopNavItems, gatewayNavSections } from "../docsData";

export type SpeechEndpointPageProps = {
  activePath: string;
  apiBaseUrl?: string;
  appTitle: string;
  surface: "openai" | "ai-sdk";
};

export const SpeechEndpointPage = ({ activePath, apiBaseUrl, appTitle, surface }: SpeechEndpointPageProps) => {

  return (
    <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Gateway" sections={gatewayNavSections}>
      <ApiEndpointPage endpoint={createSpeechEndpointDoc(surface, { apiBaseUrl })} />
    </ApiReferenceLayout>
  );
};


