import { ApiEndpointPage, ApiReferenceLayout } from "aihappey-docs-components";
import { useDocsTranslation } from "aihappey-docs-i18n";
import { createTranscriptionsEndpointDoc, docsTopNavItems, gatewayNavSections } from "../docsData";

export type TranscriptionsEndpointPageProps = {
  activePath: string;
  apiBaseUrl?: string;
  appTitle: string;
  surface: "openai" | "ai-sdk";
};

export const TranscriptionsEndpointPage = ({ activePath, apiBaseUrl, appTitle, surface }: TranscriptionsEndpointPageProps) => {
  const { t } = useDocsTranslation();

  return (
    <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Gateway" sections={gatewayNavSections}>
      <ApiEndpointPage endpoint={createTranscriptionsEndpointDoc(surface, { apiBaseUrl, t })} />
    </ApiReferenceLayout>
  );
};

