import { DocsCardGrid, DocsLayout, useDocsTheme } from "aihappey-docs-components";
import { docsHomeCards, docsTopNavItems } from "../docsData";

export type HomePageProps = {
  activePath: string;
  appTitle: string;
};

export const HomePage = ({ activePath, appTitle }: HomePageProps) => {
  const { Header } = useDocsTheme();

  return (
    <DocsLayout title={appTitle} activePath={activePath} topNavItems={docsTopNavItems}>
      <section style={{ padding: "clamp(3rem, 7vw, 7rem) clamp(1rem, 8vw, 7rem)", display: "grid", gap: "clamp(3rem, 6vw, 5rem)" }}>
        <div style={{ display: "grid", justifyItems: "center", textAlign: "center", gap: 20 }}>
          <p style={{ margin: 0, fontWeight: 700, opacity: 0.72 }}>aihappey Developers</p>
          <Header level={1} style={{ margin: 0, fontSize: "clamp(2.6rem, 7vw, 6rem)", lineHeight: 1, letterSpacing: "-0.06em" }}>
            Docs and API reference
          </Header>
          <p style={{ margin: 0, fontSize: "clamp(1.1rem, 2vw, 1.6rem)", lineHeight: 1.6, maxWidth: 900, opacity: 0.74 }}>
            Build against the aihappey stateless Gateway API and Agent API with reusable, multi-theme documentation components.
          </p>
        </div>
        <DocsCardGrid cards={docsHomeCards} />
      </section>
    </DocsLayout>
  );
};

