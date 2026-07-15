import type { ReactNode } from "react";
import type { DocsTopNavItem } from "../navigation/types";
import { docsBorderStyle } from "../theme/docsThemeStyles";
import { useDocsTheme } from "../theme/useDocsTheme";
import { DocsLink } from "./DocsLink";
import { DocsLanguageSelector } from "./DocsLanguageSelector";
import { DocsTopNav } from "./DocsTopNav";
import { ThemeSelector } from "./ThemeSelector";
import { useDocsTranslation } from "aihappey-docs-i18n";

export type DocsHeaderProps = {
  title: string;
  activePath: string;
  navItems: DocsTopNavItem[];
  dashboardHref?: string;
  actions?: ReactNode;
};

export const DocsHeader = ({ title, activePath, navItems, dashboardHref, actions }: DocsHeaderProps) => {
  const { Button, SearchBox } = useDocsTheme();
  const { t } = useDocsTranslation();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        backdropFilter: "blur(18px)",
        background: "color-mix(in srgb, currentColor 3%, transparent)",
        borderBottom: docsBorderStyle,
      }}
    >
        <div
        style={{
          minHeight: 76,
          padding: "0.85rem clamp(1rem, 2vw, 2rem)",
          display: "grid",
          gridTemplateColumns: "minmax(220px, 1fr) auto minmax(260px, 1fr)",
          gap: 18,
          alignItems: "center",
        }}
      >
        <DocsLink href="/" active={activePath === "/"} style={{ fontSize: 24, fontWeight: 800 }}>
          {title}
        </DocsLink>
        <DocsTopNav items={navItems} activePath={activePath} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
          <SearchBox value="" onChange={() => undefined} placeholder={t("header.searchPlaceholder")} style={{ width: "min(280px, 100%)" }} />
          <ThemeSelector />
          <DocsLanguageSelector />
          {dashboardHref ? (
            <DocsLink href={dashboardHref} target={dashboardHref.startsWith("http") ? "_blank" : undefined}>
              <Button type="button">{t("header.dashboard")}</Button>
            </DocsLink>
          ) : null}
          {actions}
        </div>
      </div>
    </header>
  );
};

