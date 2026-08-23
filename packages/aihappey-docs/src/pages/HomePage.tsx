import { DocsCardGrid, DocsLayout, DocsLink, docsBorderStyle, useDocsTheme } from "aihappey-docs-components";
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
          <p style={{ margin: 0, fontWeight: 700, opacity: 0.72 }}>aihappey platform</p>
          <Header level={1} style={{ margin: 0, fontSize: "clamp(2.6rem, 7vw, 6rem)", lineHeight: 1, letterSpacing: "-0.06em" }}>
            Build with aihappey
          </Header>
          <p style={{ margin: 0, fontSize: "clamp(1.1rem, 2vw, 1.6rem)", lineHeight: 1.6, maxWidth: 900, opacity: 0.74 }}>
            Build with the stateless AI Gateway, orchestrate agent workflows and extend the aihappey Chat application.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <DocsLink href="/gateway" style={{ padding: "0.8rem 1.1rem", borderRadius: 12, border: docsBorderStyle, fontWeight: 700 }}>Explore the Gateway →</DocsLink>
            <DocsLink href="/chat" style={{ padding: "0.8rem 1.1rem", borderRadius: 12, border: docsBorderStyle, fontWeight: 700 }}>Configure Chat →</DocsLink>
          </div>
        </div>
        <DocsCardGrid cards={docsHomeCards} />
      </section>
    </DocsLayout>
  );
};


