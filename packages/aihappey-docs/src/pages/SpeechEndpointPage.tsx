import { ApiEndpointPage, ApiReferenceLayout } from "aihappey-docs-components";
import { createSpeechEndpointDoc, docsTopNavItems, gatewayNavSections } from "../docsData";

export type SpeechEndpointPageProps = {
  activePath: string;
  appTitle: string;
  surface: "openai" | "ai-sdk";
};

export const SpeechEndpointPage = ({ activePath, appTitle, surface }: SpeechEndpointPageProps) => (
  <ApiReferenceLayout appTitle={appTitle} activePath={activePath} topNavItems={docsTopNavItems} sidebarTitle="Gateway" sections={gatewayNavSections}>
    <ApiEndpointPage endpoint={createSpeechEndpointDoc(surface)} />
  </ApiReferenceLayout>
);

