import type { DocsNavItem, DocsNavSection } from "../navigation/types";
import { DocsLink } from "./DocsLink";

export type DocsSidebarProps = {
  title: string;
  sections: DocsNavSection[];
  activePath: string;
};

const activeFor = (activePath: string, item: DocsNavItem) => activePath === item.href;

export const DocsSidebar = ({ title, sections, activePath }: DocsSidebarProps) => (
  <aside
    style={{
      position: "sticky",
      top: 77,
      alignSelf: "start",
      height: "calc(100dvh - 77px)",
      overflow: "auto",
      borderRight: "1px solid color-mix(in srgb, currentColor 10%, transparent)",
      padding: "2rem clamp(1rem, 2vw, 1.75rem)",
    }}
  >
    <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 18 }}>{title}</div>
    <nav aria-label={title} style={{ display: "grid", gap: 28 }}>
      {sections.map((section) => (
        <section key={section.id}>
          <div style={{ fontWeight: 800, marginBottom: 10, opacity: 0.92 }}>{section.title}</div>
          <div style={{ display: "grid", gap: 4 }}>
            {section.items.map((item) => {
              const active = activeFor(activePath, item);
              return (
                <DocsLink
                  key={item.id}
                  href={item.href}
                  active={active}
                  style={{
                    padding: "0.65rem 0.85rem",
                    background: active ? "rgba(127,127,127,0.16)" : undefined,
                    width: "100%",
                    justifyContent: "space-between",
                  }}
                >
                  <span>{item.label}</span>
                  {item.badge ? <small style={{ opacity: 0.7 }}>{item.badge}</small> : null}
                </DocsLink>
              );
            })}
          </div>
        </section>
      ))}
    </nav>
  </aside>
);

