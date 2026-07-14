import { DocsLayout } from "aihappey-docs-components";
import { docsTopNavItems } from "../docsData";

export type ComingSoonPageProps = {
  activePath: string;
  appTitle: string;
};

export const ComingSoonPage = ({ activePath, appTitle }: ComingSoonPageProps) => (
  <DocsLayout title={appTitle} activePath={activePath} topNavItems={docsTopNavItems}>
    <section style={{ padding: "clamp(3rem, 7vw, 7rem)", display: "grid", gap: 16 }}>
      <h1 style={{ margin: 0, fontSize: "clamp(2.4rem, 6vw, 5rem)", letterSpacing: "-0.06em" }}>Coming soon</h1>
      <p style={{ margin: 0, maxWidth: 760, lineHeight: 1.7, opacity: 0.76 }}>
        This route is reserved in the initial navigation so the app structure can be tested before the remaining docs are written.
      </p>
    </section>
  </DocsLayout>
);

