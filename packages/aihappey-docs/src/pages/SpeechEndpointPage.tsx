import { ApiEndpointPage, ApiReferenceLayout } from "aihappey-docs-components";
import { useDocsTranslation } from "aihappey-docs-i18n";
import { createSpeechEndpointDoc, docsTopNavItems, gatewayNavSections } from "../docsData";

export type SpeechEndpointPageProps = {
  activePath: string;
  apiBaseUrl?: string;
  appTitle: string;
  surface: "openai" | "ai-sdk";
};

export const SpeechEndpointPage = ({ activePath, apiBaseUrl, appTitle, surface }: SpeechEndpointPageProps) => {
  const { t } = useDocsTranslation();

  return (
    <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Gateway" sections={gatewayNavSections}>
      <ApiEndpointPage endpoint={createSpeechEndpointDoc(surface, { apiBaseUrl, t })} />
    </ApiReferenceLayout>
  );
};

