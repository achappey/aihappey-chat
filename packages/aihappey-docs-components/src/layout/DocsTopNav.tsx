import type { DocsTopNavItem } from "../navigation/types";
import { docsActiveSurfaceStyle } from "../theme/docsThemeStyles";
import { DocsLink } from "./DocsLink";

export type DocsTopNavProps = {
  items: DocsTopNavItem[];
  activePath: string;
};

const isActive = (activePath: string, href: string) => {
  if (href === "/") return activePath === "/";
  return activePath === href || activePath.startsWith(`${href}/`);
};

export const DocsTopNav = ({ items, activePath }: DocsTopNavProps) => (
  <nav aria-label="Primary" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
    {items.map((item) => {
      const active = isActive(activePath, item.href);
      return (
        <DocsLink
          key={item.id}
          href={item.href}
          active={active}
          style={{
            padding: "0.55rem 0.85rem",
            ...(active ? docsActiveSurfaceStyle : undefined),
          }}
        >
          {item.label}
        </DocsLink>
      );
    })}
  </nav>
);

