import type { ReactNode } from "react";
import type { DocsNavSection, DocsTopNavItem } from "../navigation/types";
import { DocsHeader } from "./DocsHeader";
import { DocsSidebar } from "./DocsSidebar";

export type DocsLayoutProps = {
  title: string;
  activePath: string;
  topNavItems: DocsTopNavItem[];
  sidebarTitle?: string;
  sidebarSections?: DocsNavSection[];
  dashboardHref?: string;
  children: ReactNode;
};

export const DocsLayout = ({
  title,
  activePath,
  topNavItems,
  sidebarTitle,
  sidebarSections,
  dashboardHref,
  children,
}: DocsLayoutProps) => {
  const hasSidebar = Boolean(sidebarTitle && sidebarSections?.length);

  return (
    <div style={{ minHeight: "100dvh", background: "Canvas", color: "CanvasText" }}>
      <DocsHeader title={title} activePath={activePath} navItems={topNavItems} dashboardHref={dashboardHref} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: hasSidebar ? "minmax(250px, 330px) minmax(0, 1fr)" : "1fr",
        }}
      >
        {hasSidebar ? <DocsSidebar title={sidebarTitle!} sections={sidebarSections!} activePath={activePath} /> : null}
        <main style={{ minWidth: 0 }}>{children}</main>
      </div>
    </div>
  );
};

