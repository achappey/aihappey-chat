import { ApiEndpointPage, ApiReferenceLayout } from "aihappey-docs-components";
import { useDocsTranslation } from "aihappey-docs-i18n";
import { createEmbeddingsEndpointDoc, docsTopNavItems, gatewayNavSections } from "../docsData";

export type EmbeddingsEndpointPageProps = {
  activePath: string;
  apiBaseUrl?: string;
  appTitle: string;
  surface: "openai" | "ai-sdk";
};

export const EmbeddingsEndpointPage = ({ activePath, apiBaseUrl, appTitle, surface }: EmbeddingsEndpointPageProps) => {
  const { t } = useDocsTranslation();

  return (
    <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Gateway" sections={gatewayNavSections}>
      <ApiEndpointPage endpoint={createEmbeddingsEndpointDoc(surface, { apiBaseUrl, t })} />
    </ApiReferenceLayout>
  );
};
