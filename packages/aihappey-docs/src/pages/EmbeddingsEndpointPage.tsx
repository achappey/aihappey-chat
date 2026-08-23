import { ApiEndpointPage, ApiReferenceLayout } from "aihappey-docs-components";
import { createEmbeddingsEndpointDoc, docsTopNavItems, gatewayNavSections } from "../docsData";

export type EmbeddingsEndpointPageProps = {
  activePath: string;
  apiBaseUrl?: string;
  appTitle: string;
  surface: "openai" | "ai-sdk";
};

export const EmbeddingsEndpointPage = ({ activePath, apiBaseUrl, appTitle, surface }: EmbeddingsEndpointPageProps) => {

  return (
    <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Gateway" sections={gatewayNavSections}>
      <ApiEndpointPage endpoint={createEmbeddingsEndpointDoc(surface, { apiBaseUrl })} />
    </ApiReferenceLayout>
  );
};

