import type { ReactNode } from "react";
import type { DocsNavSection, DocsTopNavItem } from "../navigation/types";
import { DocsLayout } from "../layout/DocsLayout";

export type ApiReferenceLayoutProps = {
  appTitle: string;
  activePath: string;
  topNavItems: DocsTopNavItem[];
  sidebarTitle: string;
  sections: DocsNavSection[];
  children: ReactNode;
};

export const ApiReferenceLayout = ({ appTitle, activePath, topNavItems, sidebarTitle, sections, children }: ApiReferenceLayoutProps) => (
  <DocsLayout title={appTitle} activePath={activePath} topNavItems={topNavItems} sidebarTitle={sidebarTitle} sidebarSections={sections}>
    {children}
  </DocsLayout>
);

