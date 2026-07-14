import { useMemo, type CSSProperties } from "react";
import { useNavigate } from "react-router";
import type { NavigationItem } from "aihappey-types";
import type { DocsNavItem, DocsNavSection } from "../navigation/types";
import { docsBorderStyle, getDocsNavBadgeLabel, getDocsNavBadgeProps } from "../theme/docsThemeStyles";
import { useDocsTheme } from "../theme/useDocsTheme";

export type DocsSidebarProps = {
  title: string;
  sections: DocsNavSection[];
  activePath: string;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
};

const activeFor = (activePath: string, item: DocsNavItem) => activePath === item.href;

export const DocsSidebar = ({ title, sections, activePath, collapsed, onToggleCollapsed }: DocsSidebarProps) => {
  const navigate = useNavigate();
  const { Badge, Button, Navigation } = useDocsTheme();

  const items = useMemo<NavigationItem[]>(
    () =>
      sections.map((section) => ({
        key: "category",
        eventKey: section.id,
        label: section.title,
        children: section.items.map((item) => ({
          key: item.href,
          eventKey: item.href,
          label: item.label,
          badge: item.badge ? <Badge size="small" {...getDocsNavBadgeProps(item.badge)}>{getDocsNavBadgeLabel(item.badge)}</Badge> : undefined,
          href: item.href,
          onClick: (event?: { preventDefault?: () => void }) => {
            event?.preventDefault?.();
            navigate(item.href);
          },
        })),
      })),
    [navigate, sections]
  );

  const activeKey = sections.flatMap((section) => section.items).find((item) => activeFor(activePath, item))?.href ?? activePath;
  const asideStyle: CSSProperties = {
    position: "sticky" as const,
    top: 77,
    alignSelf: "start" as const,
    height: "calc(100dvh - 77px)",
    overflowY: "auto" as const,
    overflowX: "hidden" as const,
    borderRight: docsBorderStyle,
    padding: collapsed ? "0.75rem 0.5rem" : 0,
    minWidth: 0,
  };
  const navigationStyle = {
    "--aih-shadcn-nav-width": "100%",
    minHeight: "100%",
    width: "100%",
    minWidth: 0,
    maxWidth: "100%",
    flex: "1 1 auto",
    overflowX: "hidden",
  } as CSSProperties;

  if (collapsed) {
    return (
      <aside style={asideStyle}>
        <Button
          type="button"
          variant="ghost"
          size="small"
          aria-label="Expand docs navigation"
          title="Expand docs navigation"
          onClick={onToggleCollapsed}
          style={{ width: 40, height: 40, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
        >
          ☰
        </Button>
      </aside>
    );
  }

  return (
    <aside style={asideStyle}>
      <Navigation
        appTitle={title}
        items={items}
        activeKey={activeKey}
        onSelect={(key) => navigate(key)}
        onClose={onToggleCollapsed}
        drawerType="inline"
        isOpen
        translations={{ closeNavigation: "Collapse docs navigation" }}
        style={navigationStyle}
      />
    </aside>
  );
};

